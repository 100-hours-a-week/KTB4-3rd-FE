import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { LocationInputButton, type LocationInputButtonProps } from './location-input-button';

const meta = {
  title: 'Shared/LocationInputButton',
  component: LocationInputButton,
  args: {
    'aria-label': '장소 선택',
    value: null,
    disabled: false,
    readOnly: false,
    invalid: false,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof LocationInputButton>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledLocationInputButton(args: LocationInputButtonProps) {
  const [value, setValue] = useState<string | null>(args.value ?? null);

  return <LocationInputButton {...args} onClear={() => setValue(null)} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledLocationInputButton {...args} />,
};

export const WithSelectedValue: Story = {
  args: {
    value: '판교역 2번 출구',
  },
  render: (args) => <ControlledLocationInputButton {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
