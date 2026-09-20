import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { BankCode } from '@/features/signup/model/bank';

import { BankSelectField } from './BankSelectField';

const meta = {
  title: 'Features/Signup/BankSelectField',
  component: BankSelectField,
  args: {
    value: null,
    onChange: () => {},
    disabled: false,
    required: false,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof BankSelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledBankSelectField(props: ComponentProps<typeof BankSelectField>) {
  const [value, setValue] = useState(props.value);

  return <BankSelectField {...props} onChange={setValue} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledBankSelectField {...args} />,
};

export const Selected: Story = {
  args: {
    value: BankCode.KB,
  },
  render: (args) => <ControlledBankSelectField {...args} />,
};

export const WithHelperText: Story = {
  args: {
    helperText: '출금에 사용할 은행을 선택해주세요.',
  },
  render: (args) => <ControlledBankSelectField {...args} />,
};

export const ErrorMessage: Story = {
  args: {
    errorMessage: '은행을 선택해주세요.',
    invalid: true,
  },
  render: (args) => <ControlledBankSelectField {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <ControlledBankSelectField {...args} />,
};
