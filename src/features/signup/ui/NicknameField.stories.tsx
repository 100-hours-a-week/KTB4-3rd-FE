import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { NicknameField } from './NicknameField';

const meta = {
  title: 'Features/Signup/NicknameField',
  component: NicknameField,
  args: {
    value: '',
    onChange: () => {},
    disabled: false,
    required: true,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof NicknameField>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledNicknameField(props: ComponentProps<typeof NicknameField>) {
  const [value, setValue] = useState(props.value);

  return <NicknameField {...props} onChange={setValue} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledNicknameField {...args} />,
};

export const Filled: Story = {
  args: {
    value: '모여타 사용자',
  },
  render: (args) => <ControlledNicknameField {...args} />,
};

export const WithHelperText: Story = {
  args: {
    helperText: '닉네임은 최대 20자까지 입력할 수 있어요.',
  },
  render: (args) => <ControlledNicknameField {...args} />,
};

export const ErrorMessage: Story = {
  args: {
    errorMessage: '이미 사용 중인 닉네임이에요.',
    invalid: true,
  },
  render: (args) => <ControlledNicknameField {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <ControlledNicknameField {...args} />,
};
