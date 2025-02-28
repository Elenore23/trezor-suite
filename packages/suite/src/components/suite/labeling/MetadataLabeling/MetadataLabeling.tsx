import { useEffect, useState, useMemo, useRef } from 'react';

import styled from 'styled-components';

import { Button, DropdownMenuItemProps, Row } from '@trezor/components';
import type { Timeout } from '@trezor/type-utils';
import { StaticSessionId } from '@trezor/connect';

import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { addMetadata, init, setEditing } from 'src/actions/suite/metadataLabelingActions';
import { MetadataAddPayload } from 'src/types/suite/metadata';
import { Translation } from 'src/components/suite';
import {
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from 'src/reducers/suite/metadataReducer';

import { Props, ExtendedProps } from './definitions';
import { withEditable } from './withEditable';
import { withDropdown } from './withDropdown';
import { AccountTypeBadge } from '../../AccountTypeBadge';

const LabelValue = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const LabelDefaultValue = styled(LabelValue)`
    display: flex;

    /* do not shrink when the expanded label does not fit the container - shrink only the label value */
    flex-shrink: 0;
    max-width: 0;

    /* transition max-width because it does not work with auto value */
    transition:
        max-width 0.25s,
        opacity 0.25s;
    transition-timing-function: ease-out;
    opacity: 0;

    &::before {
        content: '|';
        font-size: 14px;
        line-height: 14px;
        margin: 0 6px;
        opacity: 0.25;
    }
`;

const Label = styled.div`
    cursor: pointer;
    display: flex;
    overflow: hidden;
    position: relative;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const LabelButton = styled(Button)`
    overflow: hidden;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const ActionButton = styled(Button)<{ $isValueVisible?: boolean; $isVisible?: boolean }>`
    margin-left: ${({ $isValueVisible, $isVisible, isLoading }) =>
        $isValueVisible || !$isVisible || isLoading ? '12px' : '4px'};
    visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
`;

// @TODO this shouldn't be Button
// eslint-disable-next-line local-rules/no-override-ds-component
const SuccessButton = styled(Button)`
    cursor: wait;
    margin-left: 12px;
    width: auto;
    background-color: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation0};
    color: ${({ theme }) => theme.textPrimaryDefault};

    &:hover {
        color: ${({ theme }) => theme.textPrimaryDefault};
        background-color: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation0};
    }
`;

const LabelContainer = styled.div`
    display: flex;
    white-space: nowrap;
    align-items: center;
    justify-content: flex-start;
    overflow: hidden;

    &:hover {
        ${ActionButton} {
            visibility: visible;
            width: auto;
        }

        ${LabelDefaultValue} {
            max-width: 300px;
            opacity: 1;

            /* the right side of the transition process cannot be reliably animated because we animate max-width while the width can vary  */
            transition-timing-function: ease-in;
        }
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const RelativeButton = styled(Button)`
    padding-bottom: 4px;
    padding-top: 4px;
    position: relative;
    overflow: hidden;
    text-align: left;
`;

const RelativeLabel = styled(Label)<{ $isVisible?: boolean }>`
    position: relative;
    text-align: left;
`;

const Inline = styled.span`
    display: inline-flex;
`;

const ButtonLikeLabel = ({
    editActive,
    payload,
    defaultEditableValue,
    defaultVisibleValue,
    onSubmit,
    onBlur,
    'data-testid': dataTest,
}: ExtendedProps) => {
    const EditableButton = useMemo(() => withEditable(RelativeButton), []);

    if (editActive) {
        return (
            <EditableButton
                // @ts-expect-error todo: hm this needs some clever generic
                variant="tertiary"
                icon="tag"
                data-testid={dataTest}
                originalValue={payload.value ?? defaultEditableValue}
                onSubmit={onSubmit}
                onBlur={onBlur}
                size="tiny"
            />
        );
    }

    if (payload.value) {
        return (
            <LabelButton variant="tertiary" icon="tag" data-testid={dataTest} size="tiny">
                <Inline>
                    <LabelValue>{payload.value} </LabelValue>
                    {/* This is the defaultVisibleValue which shows up after you hover over the label name: */}
                    {defaultVisibleValue && (
                        <LabelDefaultValue>{defaultVisibleValue}</LabelDefaultValue>
                    )}
                </Inline>
            </LabelButton>
        );
    }

    return <>{defaultVisibleValue}</>;
};

const TextLikeLabel = ({
    accountType,
    networkType,
    path,
    editActive,
    defaultVisibleValue,
    defaultEditableValue,
    payload,
    'data-testid': dataTest,
    onSubmit,
    onBlur,
    updateFlag,
}: ExtendedProps) => {
    const EditableLabel = useMemo(() => withEditable(RelativeLabel), []);

    const isAccountLabel = payload.type === 'accountLabel';

    if (editActive) {
        return (
            <Row gap={12}>
                <EditableLabel
                    data-testid={dataTest}
                    originalValue={payload.value ?? defaultEditableValue}
                    onSubmit={onSubmit}
                    onBlur={onBlur}
                    updateFlag={updateFlag}
                />
                {isAccountLabel && (
                    <AccountTypeBadge
                        accountType={accountType}
                        networkType={networkType}
                        path={path}
                    />
                )}
            </Row>
        );
    }

    if (payload.value) {
        return (
            <Label data-testid={dataTest}>
                <Row gap={12}>
                    <LabelValue>{payload.value}</LabelValue>
                    {isAccountLabel && (
                        <AccountTypeBadge
                            accountType={accountType}
                            networkType={networkType}
                            path={path}
                        />
                    )}
                </Row>
            </Label>
        );
    }

    return <>{defaultVisibleValue}</>;
};

const getLocalizedActions = (type: MetadataAddPayload['type']) => {
    const defaultMessages = {
        add: <Translation id="TR_LABELING_ADD_LABEL" />,
        edit: <Translation id="TR_LABELING_EDIT_LABEL" />,
        edited: <Translation id="TR_LABELING_EDITED_LABEL" />,
        remove: <Translation id="TR_LABELING_REMOVE_LABEL" />,
    };
    switch (type) {
        case 'outputLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_OUTPUT" />,
                edit: <Translation id="TR_LABELING_EDIT_OUTPUT" />,
                edited: <Translation id="TR_LABELING_EDITED_LABEL" />,
                remove: <Translation id="TR_LABELING_REMOVE_OUTPUT" />,
            };
        case 'addressLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_ADDRESS" />,
                edit: <Translation id="TR_LABELING_EDIT_ADDRESS" />,
                edited: <Translation id="TR_LABELING_EDITED_LABEL" />,
                remove: <Translation id="TR_LABELING_REMOVE_ADDRESS" />,
            };
        case 'accountLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_ACCOUNT" />,
                edit: <Translation id="TR_LABELING_EDIT_ACCOUNT" />,
                edited: <Translation id="TR_LABELING_EDITED_LABEL" />,
                remove: <Translation id="TR_LABELING_REMOVE_ACCOUNT" />,
            };
        case 'walletLabel':
            return {
                add: <Translation id="TR_LABELING_ADD_WALLET" />,
                edit: <Translation id="TR_LABELING_EDIT_WALLET" />,
                edited: <Translation id="TR_LABELING_EDITED_LABEL" />,
                remove: <Translation id="TR_LABELING_REMOVE_WALLET" />,
            };
        default:
            return defaultMessages;
    }
};

/**
 * User defined labeling component.
 * - This component shows defaultVisibleValue and "Add label" button if no metadata is present.
 * - Otherwise it shows metadata value and provides way to edit it.
 */
export const MetadataLabeling = ({
    payload,
    accountType,
    networkType,
    path,
    dropdownOptions,
    defaultEditableValue,
    defaultVisibleValue,
    isDisabled,
    onSubmit,
    visible,
    updateFlag,
}: Props) => {
    const metadata = useSelector(state => state.metadata);
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();
    const [showSuccess, setShowSuccess] = useState(false);
    const [pending, setPending] = useState(false);

    const l10nLabelling = getLocalizedActions(payload.type);
    const dataTestBase = `@metadata/${payload.type}/${payload.defaultValue}`;
    const actionButtonsDisabled = isDiscoveryRunning || pending;
    const isSubscribedToSubmitResult = useRef(payload.defaultValue);
    let timeout: Timeout | undefined;
    useEffect(() => {
        setPending(false);
        setShowSuccess(false);

        return () => {
            isSubscribedToSubmitResult.current = '';
            clearTimeout(timeout!);
        };
    }, [payload.defaultValue, timeout]);

    const isLabelingInitPossible = useSelector(selectIsLabelingInitPossible);
    const deviceState =
        payload.type === 'walletLabel' ? (payload.entityKey as StaticSessionId) : undefined;
    const isLabelingAvailable = useSelector(state =>
        selectIsLabelingAvailableForEntity(state, payload.entityKey, deviceState),
    );

    // is this concrete instance being edited?
    const editActive = metadata.editing === payload.defaultValue;

    const activateEdit = () => {
        // When clicking on inline input edit, ensure that everything needed is already ready.
        if (
            // Isn't initiation in progress?
            !metadata.initiating &&
            // Is there something that needs to be initiated?
            !isLabelingAvailable
        ) {
            dispatch(
                init(
                    // Provide force=true argument (user wants to enable metadata).
                    true,
                    // If this is wallet(device) label, provide unique identifier entityKey which equals to device.state.
                    deviceState,
                ),
            );
        }
        dispatch(setEditing(payload.defaultValue));
    };

    let dropdownItems: DropdownMenuItemProps[] = [
        {
            onClick: () => activateEdit(),
            label: l10nLabelling.edit,
            'data-testid': `edit-label`, // Hack: This will be prefixed in the withDropdown()
        },
    ];

    if (dropdownOptions) {
        dropdownItems = [...dropdownItems, ...dropdownOptions];
    }

    const handleBlur = () => {
        if (!metadata.initiating) {
            dispatch(setEditing(undefined));
        }
    };

    const defaultOnSubmit = async (value: string | undefined) => {
        isSubscribedToSubmitResult.current = payload.defaultValue;
        setPending(true);
        const result = await dispatch(
            addMetadata({
                ...payload,
                value: value || undefined,
            }),
        );
        // payload.defaultValue might change during next render, this comparison
        // ensures that success state does not appear if it is no longer relevant.
        if (isSubscribedToSubmitResult.current === payload.defaultValue) {
            setPending(false);
            if (result) {
                setShowSuccess(true);
            }
            timeout = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
        }
    };

    const ButtonLikeLabelWithDropdown = useMemo(() => {
        if (payload.value) {
            return withDropdown(ButtonLikeLabel);
        }

        return ButtonLikeLabel;
    }, [payload.value]);

    const labelContainerDataTest = `${dataTestBase}/hover-container`;

    // Should "add label"/"edit label" button be visible?
    const showActionButton =
        !isDisabled &&
        (isLabelingAvailable || isLabelingInitPossible) &&
        !showSuccess &&
        !editActive;
    const isVisible = pending || visible;

    // Metadata is still initiating, on hover, show only disabled button with spinner.
    if (metadata.initiating)
        return (
            <LabelContainer data-testid={labelContainerDataTest}>
                {defaultVisibleValue}
                <ActionButton variant="tertiary" isDisabled isLoading size="tiny">
                    <Translation id="TR_LOADING" />
                </ActionButton>
            </LabelContainer>
        );

    // should "add label"/"edit label" button for output label be visible
    // special case here. It should not be visible if metadata label already exists (payload.value) because
    // this type of labels has dropdown menu instead of "add/edit label button".
    // but we still want to show pending and success status after editing the label.
    const showOutputLabelActionButton =
        showActionButton && (!payload.value || (payload.value && pending));

    return (
        <LabelContainer
            data-testid={labelContainerDataTest}
            onClick={e => editActive && e.stopPropagation()}
        >
            {payload.type === 'outputLabel' ? (
                <>
                    <ButtonLikeLabelWithDropdown
                        editActive={editActive}
                        onSubmit={onSubmit || defaultOnSubmit}
                        onBlur={handleBlur}
                        data-testid={dataTestBase}
                        payload={payload}
                        defaultEditableValue={defaultEditableValue}
                        defaultVisibleValue={defaultVisibleValue}
                        dropdownOptions={dropdownItems}
                    />
                    {showOutputLabelActionButton && (
                        <ActionButton
                            data-testid={`${dataTestBase}/add-label-button`}
                            variant="tertiary"
                            icon={!actionButtonsDisabled ? 'tag' : undefined}
                            isLoading={actionButtonsDisabled}
                            isDisabled={actionButtonsDisabled}
                            $isVisible={isVisible}
                            size="tiny"
                            $isValueVisible={!!payload.value}
                            onClick={e => {
                                e.stopPropagation();
                                // By clicking on add label button, metadata.editing field is set
                                // to default value of whatever may be labeled (address, etc..)
                                // this way we ensure that only one field may be active at time.
                                activateEdit();
                            }}
                        >
                            {l10nLabelling.add}
                        </ActionButton>
                    )}
                </>
            ) : (
                <>
                    <TextLikeLabel
                        editActive={editActive}
                        accountType={accountType}
                        onSubmit={onSubmit || defaultOnSubmit}
                        onBlur={handleBlur}
                        data-testid={dataTestBase}
                        payload={payload}
                        networkType={networkType}
                        path={path}
                        defaultEditableValue={defaultEditableValue}
                        defaultVisibleValue={defaultVisibleValue}
                        updateFlag={updateFlag}
                    />

                    {showActionButton && (
                        <ActionButton
                            data-testid={
                                payload.value
                                    ? `${dataTestBase}/edit-label-button`
                                    : `${dataTestBase}/add-label-button`
                            }
                            variant="tertiary"
                            icon={!actionButtonsDisabled ? 'tag' : undefined}
                            isLoading={actionButtonsDisabled}
                            isDisabled={actionButtonsDisabled}
                            $isVisible={isVisible}
                            size="tiny"
                            onClick={e => {
                                e.stopPropagation();
                                activateEdit();
                            }}
                        >
                            {payload.value ? l10nLabelling.edit : l10nLabelling.add}
                        </ActionButton>
                    )}
                </>
            )}

            {showSuccess && !editActive && (
                <SuccessButton
                    variant="tertiary"
                    data-testid={`${dataTestBase}/success`}
                    icon="check"
                    size="tiny"
                >
                    {l10nLabelling.edited}
                </SuccessButton>
            )}
        </LabelContainer>
    );
};
