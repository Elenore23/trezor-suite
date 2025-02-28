import { ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { borders, spacingsPx, typography } from '@trezor/theme';
import { getWeakRandomId } from '@trezor/utils';

import {
    getInputColor,
    getLabelColor,
    getFocusShadowStyle,
    focusStyleTransition,
} from '../../../utils/utils';
import { UIHorizontalAlignment } from '../../../config/types';

const Wrapper = styled.div<{
    $isSmall?: boolean; // TODO: legacy prop
    $labelPosition?: Extract<UIHorizontalAlignment, 'left' | 'right'>;
}>`
    display: flex;
    align-items: center;
    gap: ${({ $isSmall }) => ($isSmall ? spacingsPx.sm : spacingsPx.md)};
    flex-direction: ${({ $labelPosition }) => ($labelPosition === 'left' ? 'row-reverse' : 'row')};
`;

const Container = styled.div<{
    $isChecked: boolean;
    $isDisabled?: boolean;
    $isAlert?: boolean;
    $isSmall?: boolean; // TODO: legacy prop
}>`
    display: flex;
    align-items: center;
    height: ${({ $isSmall }) => ($isSmall ? '18px' : '24px')};
    width: ${({ $isSmall }) => ($isSmall ? '32px' : '44px')};
    flex-shrink: 0;
    margin: 0;
    padding: 3px;
    position: relative;
    background: ${({ $isChecked, $isDisabled, theme }) =>
        getInputColor(theme, { checked: $isChecked, disabled: $isDisabled })};
    border-radius: ${borders.radii.sm};
    transition:
        background 0.2s ease 0s,
        ${focusStyleTransition};
    cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
    box-sizing: border-box;
    border: 1px solid
        ${({ theme, $isAlert }) => `${$isAlert ? theme.borderAlertRed : 'transparent'}`};

    button {
        box-shadow: ${({ theme }) => theme.boxShadowBase};
        opacity: ${({ $isDisabled }) => $isDisabled && 0.66};
    }

    ${({ $isDisabled, theme, $isChecked }) =>
        !$isDisabled &&
        css`
            ${getFocusShadowStyle(':focus-within:has(:focus-visible)')}

            :focus-within:has(:focus-visible) {
                background: ${$isChecked
                    ? theme.backgroundPrimaryDefault
                    : theme.backgroundNeutralDisabled};
            }

            :hover {
                background: ${$isChecked
                    ? theme.backgroundPrimaryPressed
                    : theme.backgroundNeutralSubdued};
            }
        `};
`;

const Handle = styled.button<{
    $disabled?: boolean;
    $isChecked: boolean;
    $isSmall?: boolean; // TODO: legacy prop
}>`
    position: absolute;
    display: inline-block;
    height: ${({ $isSmall }) => ($isSmall ? '14px' : '20px')};
    width: ${({ $isSmall }) => ($isSmall ? '14px' : '20px')};
    border: none;
    left: 1px;
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.legacy.TYPE_WHITE};
    transform: ${({ $isChecked, $isSmall }) =>
        $isChecked && `translateX(${$isSmall ? '14px' : '20px'})`};
    transition: transform 0.25s ease 0s;
    cursor: ${({ $disabled }) => !$disabled && 'pointer'};
`;

const CheckboxInput = styled.input`
    border: 0;
    clip: rect(0, 0, 0, 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
`;

const Label = styled.label<{
    $isDisabled?: boolean;
    $isAlert?: boolean;
    $isSmall?: boolean; // TODO: legacy prop
}>`
    color: ${({ $isAlert, $isDisabled, theme }) =>
        getLabelColor(theme, { alert: $isAlert, disabled: $isDisabled })};
    ${({ $isSmall }) => ($isSmall ? typography.label : typography.body)}
`;

export interface SwitchProps {
    isChecked: boolean;
    label?: ReactNode;
    onChange: (isChecked?: boolean) => void;
    isDisabled?: boolean;
    isAlert?: boolean;
    isSmall?: boolean; // TODO: legacy prop
    className?: string;
    'data-testid'?: string;
    labelPosition?: Extract<UIHorizontalAlignment, 'left' | 'right'>;
}

export const Switch = ({
    onChange,
    isDisabled = false,
    isAlert,
    isSmall,
    label,
    'data-testid': dataTest,
    isChecked,
    className,
    labelPosition = 'right',
}: SwitchProps) => {
    const id = getWeakRandomId(10);

    const handleChange = () => {
        if (isDisabled) return;
        onChange(!isChecked);
    };

    return (
        <Wrapper $labelPosition={labelPosition} className={className}>
            <Container
                // @ts-expect-error - needed for cypress retry-ability
                disabled={isDisabled}
                $isChecked={isChecked}
                $isDisabled={isDisabled}
                $isAlert={isAlert}
                onClick={e => {
                    e.preventDefault();
                    handleChange();
                }}
                data-testid={dataTest}
                $isSmall={isSmall}
            >
                <Handle
                    tabIndex={-1}
                    $isChecked={isChecked}
                    $disabled={isDisabled}
                    type="button"
                    $isSmall={isSmall}
                />
                <CheckboxInput
                    id={id}
                    type="checkbox"
                    role="switch"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={handleChange}
                    aria-checked={isChecked}
                />
            </Container>

            {label && (
                <Label $isDisabled={isDisabled} $isAlert={isAlert} $isSmall={isSmall} htmlFor={id}>
                    {label}
                </Label>
            )}
        </Wrapper>
    );
};
