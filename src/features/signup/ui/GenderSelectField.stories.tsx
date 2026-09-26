import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { GenderCode } from '@/features/signup/model/gender';

import { GenderSelectField } from './GenderSelectField';

const meta = {
  title: 'Features/Signup/GenderSelectField',
  component: GenderSelectField,
  args: {
    value: null,
    onChange: () => {},
    disabled: false,
    required: true,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof GenderSelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledGenderSelectField(props: ComponentProps<typeof GenderSelectField>) {
  const [value, setValue] = useState(props.value);

  return <GenderSelectField {...props} onChange={setValue} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledGenderSelectField {...args} />,
};

export const Selected: Story = {
  args: {
    value: GenderCode.MALE,
  },
  render: (args) => <ControlledGenderSelectField {...args} />,
};

export const ErrorMessage: Story = {
  args: {
    errorMessage: '성별을 선택해주세요.',
    invalid: true,
  },
  render: (args) => <ControlledGenderSelectField {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <ControlledGenderSelectField {...args} />,
};
