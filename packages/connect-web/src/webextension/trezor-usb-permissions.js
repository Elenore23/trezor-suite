const VERSION = '9.4.5-beta.1';
const versionN = VERSION.split('.').map(s => parseInt(s, 10));

const isBeta = VERSION.includes('beta');

const url = isBeta
    ? `https://connect.trezor.io/${VERSION}/`
    : `https://connect.trezor.io/${versionN[0]}/`;

/* Handling messages from usb permissions iframe */
const switchToPopupTab = event => {
    window.removeEventListener('beforeunload', switchToPopupTab);

    if (!event) {
        // triggered from 'usb-permissions-close' message
        // close current tab
        chrome.tabs.query(
            {
                currentWindow: true,
                active: true,
            },
            current => {
                if (current.length < 0) return;
                chrome.tabs.remove(current[0].id);
            },
        );
    }

    // find tab by popup pattern and switch to it
    chrome.tabs.query(
        {
            url: `${url}popup.html`,
        },
        tabs => {
            if (tabs.length < 0) return;
            chrome.tabs.update(tabs[0].id, { active: true });
        },
    );
};

window.addEventListener('message', event => {
    if (event.data === 'usb-permissions-init') {
        const iframe = document.getElementById('trezor-usb-permissions');
        if (!iframe || !(iframe instanceof HTMLIFrameElement)) {
            throw new Error('trezor-usb-permissions missing or incorrect dom type');
        }
        iframe.contentWindow.postMessage(
            {
                type: 'usb-permissions-init',
                extension: chrome.runtime.id,
            },
            '*',
        );
    } else if (event.data === 'usb-permissions-close') {
        switchToPopupTab();
    }
});

window.addEventListener('beforeunload', switchToPopupTab);
window.addEventListener('load', () => {
    const instance = document.createElement('iframe');
    instance.id = 'trezor-usb-permissions';
    instance.frameBorder = '0';
    instance.width = '100%';
    instance.height = '100%';
    instance.style.border = '0px';
    instance.style.width = '100%';
    instance.style.height = '100%';
    instance.setAttribute('src', `${url}extension-permissions.html`);
    instance.setAttribute('allow', 'usb');

    if (document.body) {
        document.body.appendChild(instance);
    }
});
