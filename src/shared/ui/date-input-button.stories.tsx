import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { DateInputButton, type DateInputButtonProps } from './date-input-button';

const defaultDate = new Date(2026, 8, 23);

const meta = {
  title: 'Shared/DateInputButton',
  component: DateInputButton,
  args: {
    'aria-label': '날짜 선택',
    value: null,
    disabled: false,
    readOnly: false,
    invalid: false,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof DateInputButton>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledDateInputButton(args: DateInputButtonProps) {
  const [value, setValue] = useState<Date | null>(args.value ?? null);

  return (
    <DateInputButton
      {...args}
      onClear={() => setValue(null)}
      onValueChange={setValue}
      value={value}
    />
  );
}

export const Playground: Story = {
  render: (args) => <ControlledDateInputButton {...args} />,
};

export const WithSelectedValue: Story = {
  args: {
    value: defaultDate,
  },
  render: (args) => <ControlledDateInputButton {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const CustomBottomSheetTitle: Story = {
  args: {
    bottomSheetTitle: '약속 날짜',
  },
  render: (args) => <ControlledDateInputButton {...args} />,
};
