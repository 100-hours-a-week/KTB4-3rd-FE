import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { TimeInputButton, type TimeInputButtonProps } from './time-input-button';
import type { TimePickerValue } from './time-picker';

const defaultTime: TimePickerValue = {
  period: '오후',
  hour: 6,
  minute: 40,
};

const meta = {
  title: 'Shared/TimeInputButton',
  component: TimeInputButton,
  args: {
    'aria-label': '시간 선택',
    value: null,
    disabled: false,
    readOnly: false,
    invalid: false,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof TimeInputButton>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledTimeInputButton(args: TimeInputButtonProps) {
  const [value, setValue] = useState<TimePickerValue | null>(args.value ?? null);

  return (
    <TimeInputButton
      {...args}
      onClear={() => setValue(null)}
      onValueChange={setValue}
      value={value}
    />
  );
}

export const Playground: Story = {
  render: (args) => <ControlledTimeInputButton {...args} />,
};

export const WithSelectedValue: Story = {
  args: {
    value: defaultTime,
  },
  render: (args) => <ControlledTimeInputButton {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const CustomBottomSheetTitle: Story = {
  args: {
    bottomSheetTitle: '약속 시간',
  },
  render: (args) => <ControlledTimeInputButton {...args} />,
};
