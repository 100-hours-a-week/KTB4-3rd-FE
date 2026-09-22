import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { DatePicker, type DatePickerProps } from './date-picker';

const defaultDate = new Date(2026, 1, 9);
const today = new Date(2026, 1, 7);

const meta = {
  title: 'Shared/DatePicker',
  component: DatePicker,
  args: {
    value: defaultDate,
    today,
    minDate: new Date(2026, 1, 4),
    'aria-label': '출발 날짜',
    disabled: false,
  },
  argTypes: {
    disabled: {
      control: 'boolean',
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledDatePicker(args: DatePickerProps) {
  const [value, setValue] = useState<Date | null>(args.value ?? null);

  return <DatePicker {...args} onValueChange={setValue} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledDatePicker {...args} />,
};

export const YearMonthSelector: Story = {
  render: (args) => <ControlledDatePicker {...args} />,
  play: async ({ canvasElement }) => {
    canvasElement
      .querySelector('button[aria-controls="date-picker-content"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  },
};

export const WithoutSelectedDate: Story = {
  args: {
    value: null,
  },
  render: (args) => <ControlledDatePicker {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
