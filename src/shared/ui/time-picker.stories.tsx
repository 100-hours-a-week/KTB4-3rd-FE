import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { TimePicker, type TimePickerProps, type TimePickerValue } from './time-picker';

const defaultTime: TimePickerValue = {
  period: '오후',
  hour: 6,
  minute: 40,
};

const meta = {
  title: 'Shared/TimePicker',
  component: TimePicker,
  args: {
    value: defaultTime,
    onValueChange: () => {},
    disabled: false,
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TimePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledTimePicker(args: TimePickerProps) {
  const [value, setValue] = useState(args.value ?? defaultTime);

  return <TimePicker {...args} onValueChange={setValue} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledTimePicker {...args} />,
};

export const Morning: Story = {
  args: {
    value: {
      period: '오전',
      hour: 9,
      minute: 10,
    },
  },
  render: (args) => <ControlledTimePicker {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
