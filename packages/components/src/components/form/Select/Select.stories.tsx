import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { Select as SelectComponent, SelectProps } from './Select';

const values: any = {
    'None (default)': null,
    Low: { label: 'low', value: 'low' },
    Medium: { label: 'medium', value: 'medium' },
    High: { label: 'high', value: 'high' },
    Custom: { label: 'custom', value: 'custom' },
};

const options = Object.keys(values)
    .filter((k: string) => values[k])
    .map((k: string) => values[k]);

const meta: Meta = {
    title: 'Form',
    component: SelectComponent,
} as Meta;
export default meta;

export const Select: StoryObj<SelectProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ option }, updateArgs] = useArgs();
        const setOption = (option2: { label: string; value: 'string' }) =>
            updateArgs({ option: option2 });

        return <SelectComponent {...args} value={option} onChange={setOption} options={options} />;
    },
    args: {
        label: 'Label',
        isClean: false,
        isDisabled: false,
        isSearchable: false,
        size: 'large',
        minValueWidth: 'initial',
        isMenuOpen: undefined,
        useKeyPressScroll: undefined,
    },
    argTypes: {
        label: {
            table: {
                type: {
                    summary: 'ReactNode',
                },
            },
        },
        isClean: {
            control: {
                type: 'boolean',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        isSearchable: {
            control: {
                type: 'boolean',
            },
        },
        bottomText: {
            control: { type: 'text' },
        },
        labelHoverRight: { control: 'text' },
        labelLeft: { control: 'text' },
        labelRight: { control: 'text' },
        size: {
            control: {
                type: 'radio',
            },
            options: ['large', 'small'],
        },
        minValueWidth: {
            control: { type: 'text' },
        },
        isMenuOpen: {
            control: {
                type: 'boolean',
            },
        },
        useKeyPressScroll: {
            control: {
                type: 'boolean',
            },
        },
        inputState: { control: 'select', options: ['error', 'warning', 'primary'] },
        placeholder: {
            control: { type: 'text' },
        },
    },
};
