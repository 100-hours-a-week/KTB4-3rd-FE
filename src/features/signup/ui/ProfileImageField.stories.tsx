import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { ProfileImageField } from './ProfileImageField';

const meta = {
  title: 'Features/Signup/ProfileImageField',
  component: ProfileImageField,
  args: {
    value: null,
    onChange: () => {},
    disabled: false,
    required: true,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ProfileImageField>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledProfileImageField(props: ComponentProps<typeof ProfileImageField>) {
  const [value, setValue] = useState<File | null>(props.value);

  return <ProfileImageField {...props} onChange={setValue} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledProfileImageField {...args} />,
};

export const Required: Story = {
  args: {
    required: true,
  },
  render: (args) => <ControlledProfileImageField {...args} />,
};

export const ErrorMessage: Story = {
  args: {
    errorMessage: '프로필 이미지를 확인해주세요.',
    invalid: true,
  },
  render: (args) => <ControlledProfileImageField {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <ControlledProfileImageField {...args} />,
};
