import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { Checkbox } from './checkbox';

const meta = {
  title: 'Shared/Checkbox',
  component: Checkbox,
  args: {
    label: '서비스 이용약관 동의',
    requirement: 'required',
    weight: 'regular',
    disabled: false,
  },
  argTypes: {
    requirement: {
      control: 'select',
      options: ['required', 'optional', null],
    },
    weight: {
      control: 'inline-radio',
      options: ['regular', 'bold'],
    },
    disabled: {
      control: 'boolean',
    },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledCheckbox(args: ComponentProps<typeof Checkbox>) {
  const [checked, setChecked] = useState(args.defaultChecked ?? false);

  return <Checkbox {...args} checked={checked} onCheckedChange={setChecked} />;
}

export const Playground: Story = {
  render: (args) => <ControlledCheckbox {...args} />,
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const OptionalBold: Story = {
  args: {
    requirement: 'optional',
    weight: 'bold',
  },
};

export const Disabled: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
};
