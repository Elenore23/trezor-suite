/* eslint-disable @typescript-eslint/no-use-before-define */

// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/popup.js/
import {
    POPUP,
    IFRAME,
    UI_REQUEST,
    RESPONSE_EVENT,
    parseMessage,
    createPopupMessage,
    UiEvent,
    PopupEvent,
    PopupInit,
    PopupHandshake,
    MethodResponseMessage,
    IFrameCallMessage,
    IFrameLogRequest,
    CoreEventMessage,
    PopupContentScriptLoaded,
} from '@trezor/connect/src/exports';
import type { Core } from '@trezor/connect/src/core';
import { config } from '@trezor/connect/src/data/config';
import { parseConnectSettings } from '@trezor/connect-iframe/src/connectSettings';
import { initLogWriterWithSrcPath } from '@trezor/connect-iframe/src/sharedLoggerUtils';
import { reactEventBus } from '@trezor/connect-ui/src/utils/eventBus';
import { ErrorViewProps } from '@trezor/connect-ui/src/views/Error';
import { analytics, EventType } from '@trezor/connect-analytics';
import { getSystemInfo } from '@trezor/connect-common';
import { initLog, setLogWriter, LogWriter } from '@trezor/connect/src/utils/debug';
import { DEFAULT_DOMAIN } from '@trezor/connect/src/data/version';

import * as view from './view';
import {
    getState,
    setState,
    initMessageChannelWithIframe,
    postMessageToParent,
    renderConnectUI,
    showView,
} from './view/common';
import { isPhishingDomain } from './utils/isPhishingDomain';

const INTERVAL_CHECK_PARENT_ALIVE_MS = 1000;
const INTERVAL_HANDSHAKE_TIMEOUT_MS = 90 * 1000;

const log = initLog('@trezor/connect-popup');
const proxyLogger = initLog('@trezor/connect-webextension');

let handshakeTimeout: ReturnType<typeof setTimeout>;
let renderConnectUIPromise: Promise<void> | undefined;

// browser built-in functionality to quickly and safely escape the string
const escapeHtml = (payload: any) => {
    if (!payload) return;
    try {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(JSON.stringify(payload)));

        return JSON.parse(div.innerHTML);
    } catch {
        // do nothing
    }
};

export const handleUIAffectingMessage = (message: CoreEventMessage) => {
    switch (message.type) {
        case POPUP.METHOD_INFO:
            setState({
                method: message.payload.method,
                info: message.payload.info,
            });
            reactEventBus.dispatch({ type: 'state-update', payload: getState() });

            return;
        case UI_REQUEST.TRANSPORT:
        case UI_REQUEST.FIRMWARE_OUTDATED:
        case UI_REQUEST.DEVICE_NEEDS_BACKUP:
        case UI_REQUEST.REQUEST_PASSPHRASE:
            // todo: I don't have power to solve this now
            // @ts-expect-error
            reactEventBus.dispatch(message);

            // already implemented in react. return here
            return;
        case UI_REQUEST.BUNDLE_PROGRESS:
            reactEventBus.dispatch({
                type: 'loading',
                message: 'Loading...\n' + message.payload.progress + '/' + message.payload.total,
            });

            return;
        default:
        // no default
    }

    // otherwise we still render in legacy way
    switch (message.type) {
        case UI_REQUEST.LOADING:
        case UI_REQUEST.REQUEST_UI_WINDOW:
            showView('loader');
            break;
        case UI_REQUEST.SELECT_DEVICE:
            view.selectDevice(message.payload);
            break;
        case UI_REQUEST.SELECT_ACCOUNT:
            view.selectAccount(message.payload);
            break;
        case UI_REQUEST.SELECT_FEE:
            view.selectFee(message.payload);
            break;
        case UI_REQUEST.UPDATE_CUSTOM_FEE:
            view.updateCustomFee(message.payload);
            break;
        case UI_REQUEST.INSUFFICIENT_FUNDS:
            showView('insufficient-funds');
            break;
        case UI_REQUEST.REQUEST_BUTTON:
            view.requestButton(message.payload);
            break;
        case UI_REQUEST.BOOTLOADER:
            showView('bootloader');
            break;
        case UI_REQUEST.NOT_IN_BOOTLOADER:
            showView('not-in-bootloader');
            break;
        case UI_REQUEST.INITIALIZE:
            showView('initialize');
            break;
        case UI_REQUEST.SEEDLESS:
            showView('seedless');
            break;
        case UI_REQUEST.FIRMWARE_NOT_INSTALLED:
            showView('firmware-install');
            break;
        case UI_REQUEST.FIRMWARE_OLD:
            view.firmwareRequiredUpdate(message.payload);
            break;
        case UI_REQUEST.FIRMWARE_NOT_SUPPORTED:
            view.firmwareNotSupported(message.payload);
            break;
        case UI_REQUEST.FIRMWARE_NOT_COMPATIBLE:
            view.firmwareNotCompatible(message.payload);
            break;
        case UI_REQUEST.REQUEST_PERMISSION:
            view.initPermissionsView(message.payload);
            break;
        case UI_REQUEST.REQUEST_CONFIRMATION:
            view.initConfirmationView(message.payload);
            break;
        case UI_REQUEST.REQUEST_PIN:
            view.initPinView(message.payload);
            break;
        case UI_REQUEST.REQUEST_WORD:
            view.initWordView(message.payload);
            break;
        case UI_REQUEST.INVALID_PIN:
            showView('invalid-pin');
            break;
        // comes when user clicks "enter on device"
        case UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE:
            view.passphraseOnDeviceView(message.payload);
            break;
        case UI_REQUEST.INVALID_PASSPHRASE:
            view.initInvalidPassphraseView(message.payload);
            break;
        // no default
    }
};

const handleResponseEvent = (data: MethodResponseMessage) => {
    if (getState().core) {
        // If we send this event to parent when iframe mode it gets duplicated in connect-web.
        postMessageToParent(data);
    }

    // When success we can close popup.
    if (data.success) {
        window.closeWindow();
    }

    if (!data.success && typeof data.payload === 'object') {
        const code =
            'code' in data.payload && typeof data.payload.code === 'string'
                ? data.payload.code
                : undefined;
        switch (code) {
            case 'Device_CallInProgress':
                // Ignoring when device call is in progress.
                // User triggers new call but device call is in progress PopupManager will focus popup.
                break;
            case 'Transport_Missing':
                // Ignore this error. It is handled after.
                break;
            case 'Method_PermissionsNotGranted':
            case 'Method_Cancel':
                // User canceled process, close popup.
                window.closeWindow();
                break;
            default:
                fail({
                    type: 'error',
                    code,
                    detail: 'response-event-error',
                    message: ('error' in data.payload && data.payload.error) || 'Unknown error',
                });
                analytics.report({
                    type: EventType.ViewChangeError,
                    payload: { code: code || 'Code missing' },
                });
        }
    }
};

/**
 * receive initial configuration from npm package
 */
const handleInitMessage = (event: MessageEvent<PopupEvent | IFrameLogRequest>) => {
    const { data } = event;
    if (!data) return;

    // case of webextension which uses cross origin communication via content script
    if (data.type === POPUP.CONTENT_SCRIPT_LOADED) {
        handleContentScriptLoaded(data);

        return;
    }

    // This is message from the window.opener
    if (data.type === POPUP.INIT) {
        init(escapeHtml(data.payload));
        window.removeEventListener('message', handleInitMessage);
    }
};

const handleMessageInIframeMode = (
    event: MessageEvent<PopupEvent | UiEvent | MethodResponseMessage>,
) => {
    const { data } = event;

    if (!data) return;

    if (disposed) return;

    log.debug('handleMessage', data);
    if (data.type === RESPONSE_EVENT) {
        handleResponseEvent(data);
    }

    // This is message from the window.opener
    if (data.type === UI_REQUEST.IFRAME_FAILURE) {
        fail({
            type: 'error',
            detail: 'iframe-failure',
        });

        return;
    }

    // ignore messages from origin other then MessagePort (iframe)
    const isMessagePort =
        event.target instanceof MessagePort ||
        (typeof BroadcastChannel !== 'undefined' && event.target instanceof BroadcastChannel);
    if (!isMessagePort) return;

    // catch first message from iframe
    if (data.type === POPUP.HANDSHAKE) {
        handshake(data, event.origin);

        return;
    }

    const message = parseMessage<CoreEventMessage>(data);

    analytics.report({ type: EventType.ViewChange, payload: { nextView: message.type } });

    if (
        message?.payload &&
        typeof message.payload === 'object' &&
        'analytics' in message.payload &&
        message.payload.analytics
    ) {
        analytics.report(message.payload.analytics);
    }

    handleUIAffectingMessage(message);
};

const handleMessageInCoreMode = (
    event: MessageEvent<
        PopupEvent | UiEvent | IFrameLogRequest | IFrameCallMessage | MethodResponseMessage
    >,
) => {
    const { data } = event;

    if (!data) return;

    if (disposed) return;

    if (data.type === POPUP.CONTENT_SCRIPT_LOADED) {
        handleContentScriptLoaded(data);

        return;
    }

    if (data.type === POPUP.HANDSHAKE) {
        handshake(data, getState().settings?.origin || '');
        const core = ensureCore();
        const transport = core.getTransportInfo();
        setState({
            ...data,
            transport,
        });
        reactEventBus.dispatch({ type: 'state-update', payload: getState() });

        return;
    }

    if (data.type === IFRAME.CALL) {
        const core = ensureCore();
        core.handleMessage(data);

        core.getCurrentMethod().then(method => {
            log.debug('handling method in popup', method.name);

            setState({
                method: method.name,
                info: method.info,
            });
            reactEventBus.dispatch({ type: 'state-update', payload: getState() });

            const { settings } = getState();
            const transport = core.getTransportInfo();
            analytics.report({
                type: EventType.AppReady,
                payload: {
                    version: settings?.version,
                    origin: settings?.origin,
                    referrerApp: settings?.manifest?.appUrl,
                    referrerEmail: settings?.manifest?.email,
                    method: method?.name,
                    payload: method?.payload ? Object.keys(method.payload) : undefined,
                    transportType: transport?.type,
                    transportVersion: transport?.version,
                },
            });
        });
    }

    const message = parseMessage<CoreEventMessage>(data);

    handleUIAffectingMessage(message);
};

const handleWindowBeforeUnload = (_e: BeforeUnloadEvent) => {
    if (getState().core) {
        const core = ensureCore();
        core.handleMessage({
            type: POPUP.CLOSED,
            payload: null,
        });
    }
};

const handleParentClosed = () => {
    window.close();
};

const handleLogMessage = (event: MessageEvent<IFrameLogRequest>) => {
    const { data } = event;
    if (!data) return;

    if (data.type === IFRAME.LOG) {
        proxyLogger.addMessage(
            {
                level: data.payload.level,
                prefix: data.payload.prefix,
                timestamp: data.payload.timestamp,
            },
            ...data.payload.message,
        );
    }
};

const handleContentScriptLoaded = (data: PopupContentScriptLoaded) => {
    log.debug('content-script loaded', data.payload);
    // Check if extension ID matches the popup URL
    const urlParams = new URLSearchParams(window.location.search);
    const targetExtensionId = urlParams.get('extension-id');
    if (targetExtensionId && targetExtensionId !== data.payload.id) {
        // Wrong extension ID, ignore it
        return;
    }
    setState({
        settings: {
            ...getState().settings!,
            origin: data.payload.id,
        },
    });
    reactEventBus.dispatch({ type: 'state-update', payload: getState() });
};

// handle POPUP.INIT message from window.opener
const init = async (payload: PopupInit['payload']) => {
    log.debug('popup init', payload);

    if (!payload) return;

    // try to establish connection with iframe
    try {
        if (!payload.systemInfo) {
            payload.systemInfo = getSystemInfo(config.supportedBrowsers);
        }

        const isBrowserSupported = await view.initBrowserView(payload.systemInfo);
        log.debug('browser supported: ', isBrowserSupported);
        if (!isBrowserSupported) {
            return;
        }

        // render react view
        renderConnectUIPromise = renderConnectUI();
        await renderConnectUIPromise;
        log.debug('connect-ui rendered');

        let logWriterFactory;
        if (payload.settings.sharedLogger !== false) {
            logWriterFactory = initLogWriterWithSrcPath('./workers/shared-logger-worker.js');
            setLogWriter(logWriterFactory);
        }

        if (payload.useCore) {
            addWindowEventListener('message', handleMessageInCoreMode, false);
            addWindowEventListener('beforeunload', handleWindowBeforeUnload, false);
            if (window.opener) {
                // Most reliable way to detect parent close seems to be to check it periodically
                setInterval(() => {
                    if (!window.opener || window.opener.closed) {
                        handleParentClosed();
                    }
                }, INTERVAL_CHECK_PARENT_ALIVE_MS);
            }
            await initCoreInPopup(payload, logWriterFactory);
        } else {
            addWindowEventListener('message', handleMessageInIframeMode, false);
            await initCoreInIframe(payload);
        }
    } catch (error) {
        postMessageToParent(createPopupMessage(POPUP.ERROR, { error: error.message }));
    }
};

const initCoreInPopup = async (
    payload: PopupInit['payload'],
    logWriterFactory?: () => LogWriter | undefined,
) => {
    // dynamically load core module
    reactEventBus.dispatch({ type: 'loading', message: 'loading core' });

    const connectSrc = payload.settings.connectSrc ?? DEFAULT_DOMAIN;
    // core is built in a separate build step.
    const { initCoreState, initTransport } = await import(
        /* webpackIgnore: true */ `${connectSrc}js/core.js`
    ).catch(_err => {
        fail({
            type: 'error',
            detail: 'core-failed-to-load',
        });
    });

    if (!initCoreState) return;
    if (disposed) return;

    const state = getState();
    if (!payload.settings.origin) {
        // Assign origin for core in popup modes
        if (state.settings?.origin) {
            payload.settings.origin = state.settings.origin;
        } else if (window.opener) {
            payload.settings.origin = window.opener.origin;
        }
    }

    // init core
    log.debug('initiating core with settings: ', payload.settings);
    reactEventBus.dispatch({ type: 'loading', message: 'initiating core' });
    const onCoreEvent = (event: any) => {
        const message = parseMessage<CoreEventMessage>(event);
        handleUIAffectingMessage(message);
        if (message.type === RESPONSE_EVENT) {
            handleResponseEvent(message);
        }
    };
    const coreManager = initCoreState();
    const core: Core = await coreManager.getOrInit(
        { ...payload.settings, trustedHost: false },
        onCoreEvent,
        logWriterFactory,
    );
    if (disposed) return;

    setState({ core });
    log.debug('initiated core');

    // init transport - deprecated, here for backward compatibility
    if (initTransport) {
        log.debug('initiating transport with settings: ', payload.settings);
        reactEventBus.dispatch({ type: 'loading', message: 'initiating transport' });
        await initTransport(payload.settings);
        if (disposed) return;
    }
    log.debug('initiated transport');

    // done, in popup, we are ready to handle incoming messages
    // todo: would it make sense to unify this with IFRAME.LOADED?
    postMessageToParent(createPopupMessage(POPUP.CORE_LOADED));
    reactEventBus.dispatch({
        type: 'loading',
        message: `waiting for handshake from a 3rd party application`,
    });
};

const initCoreInIframe = async (payload: PopupInit['payload']) => {
    reactEventBus.dispatch({ type: 'loading', message: 'waiting for iframe init' });
    await initMessageChannelWithIframe(payload, handleMessageInIframeMode);
    // done, popup is ready to handle incoming messages, waiting for handshake from iframe
    reactEventBus.dispatch({ type: 'loading', message: 'waiting for handshake' });
};

// handle POPUP.HANDSHAKE message from iframe or npm-client
const handshake = (handshake2: PopupHandshake, origin: string) => {
    const { payload, ...handshakeRest } = handshake2;
    log.debug('handshake with origin: ', origin, 'payload: ', payload);

    if (!payload) return;

    clearTimeout(handshakeTimeout);

    let thirdPartyOrigin = origin;
    // `origin` is empty string when using `BroadcastChannel` in iframe popup mode,
    // so when that happens we use origin from settings and validate it with `parseConnectSettings`.
    if (origin === '' && payload.settings.origin) {
        thirdPartyOrigin = payload.settings.origin;
    }
    // when this message comes from iframe, settings is already validated.
    // when there is no iframe, we must validate it here
    const trustedSettings = parseConnectSettings(payload.settings, thirdPartyOrigin);
    // useCoreInPopup is internal setting passed from connect-web
    if (typeof payload.settings.useCoreInPopup === 'boolean') {
        trustedSettings.useCoreInPopup = payload.settings.useCoreInPopup;
    }
    setState({ settings: trustedSettings });

    if (isPhishingDomain(trustedSettings.origin || '')) {
        reactEventBus.dispatch({ type: 'phishing-domain' });
    }

    if (getState().core) {
        const core = ensureCore();
        core.handleMessage(handshakeRest);
    }
    reactEventBus.dispatch({ type: 'state-update', payload: handshake2.payload });

    log.debug('handshake done');
};

const ensureCore = () => {
    const { core } = getState();
    if (!core) {
        fail({
            type: 'error',
            detail: 'core-missing',
        });
        throw new Error('connect core is missing');
    }

    return core;
};

// register onLoad event
const onLoad = () => {
    postMessageToParent(createPopupMessage(POPUP.LOADED));
    handshakeTimeout = setTimeout(() => {
        fail({
            type: 'error',
            detail: 'handshake-timeout',
        });
    }, INTERVAL_HANDSHAKE_TIMEOUT_MS);
};

/**
 * keep track of all window listeners
 */
const windowEventListeners: { type: keyof WindowEventMap; listener: (args: any) => void }[] = [];
const addWindowEventListener = <K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
) => {
    windowEventListeners.push({ type, listener });
    window.addEventListener(type, listener, options);
};

let disposed = false;
const fail = (error: ErrorViewProps) => {
    log.debug('fail: ', error);
    renderConnectUIPromise?.then(() => {
        reactEventBus.dispatch(error);
    });
    windowEventListeners.forEach(listener => {
        window.removeEventListener(listener.type, listener.listener);
    });

    disposed = true;
};

addWindowEventListener('load', onLoad, false);
if (document.readyState === 'complete') {
    onLoad();
}
addWindowEventListener('message', handleInitMessage, false);
addWindowEventListener('message', handleLogMessage, false);

// global method used in html-inline elements
window.closeWindow = () => {
    setTimeout(() => {
        window.postMessage(
            {
                type: POPUP.CLOSE_WINDOW,
                channel: {
                    here: '@trezor/connect-popup',
                    peer: '@trezor/connect-web',
                },
            },
            window.location.origin,
        );
        window.close();
    }, 300);
};
