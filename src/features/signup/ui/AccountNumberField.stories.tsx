import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { AccountNumberField } from './AccountNumberField';

const meta = {
  title: 'Features/Signup/AccountNumberField',
  component: AccountNumberField,
  args: {
    value: '',
    onChange: () => {},
    disabled: false,
    required: false,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof AccountNumberField>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledAccountNumberField(props: ComponentProps<typeof AccountNumberField>) {
  const [value, setValue] = useState(props.value);

  return <AccountNumberField {...props} onChange={setValue} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledAccountNumberField {...args} />,
};

export const Filled: Story = {
  args: {
    value: '110123456789',
  },
  render: (args) => <ControlledAccountNumberField {...args} />,
};

export const WithHelperText: Story = {
  args: {
    helperText: '정산에 사용할 계좌번호를 입력해주세요.',
  },
  render: (args) => <ControlledAccountNumberField {...args} />,
};

export const ErrorMessage: Story = {
  args: {
    errorMessage: '계좌번호를 입력해주세요.',
    invalid: true,
  },
  render: (args) => <ControlledAccountNumberField {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <ControlledAccountNumberField {...args} />,
};
