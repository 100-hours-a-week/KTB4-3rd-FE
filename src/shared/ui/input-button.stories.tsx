import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { Icon } from './icon';
import { InputButton } from './input-button';

const meta = {
  title: 'Shared/InputButton',
  component: InputButton,
  args: {
    'aria-label': '이동수단',
    placeholder: '이동수단을 선택해 주세요',
    value: null,
    disabled: false,
    readOnly: false,
    invalid: false,
  },
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    readOnly: {
      control: 'boolean',
    },
    invalid: {
      control: 'boolean',
    },
    clearButton: {
      control: 'boolean',
    },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof InputButton>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledInputButton(args: ComponentProps<typeof InputButton>) {
  const [value, setValue] = useState(args.value);

  return <InputButton {...args} onClear={() => setValue(null)} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledInputButton {...args} />,
};

export const WithSelectedValue: Story = {
  args: {
    value: '지하철',
  },
  render: (args) => <ControlledInputButton {...args} />,
};

export const WithPrefixAndSuffix: Story = {
  args: {
    prefix: <Icon aria-hidden="true" name="houseLine" size={20} />,
    suffix: <Icon aria-hidden="true" name="chevronDown" size={20} />,
  },
  render: (args) => <ControlledInputButton {...args} />,
};

export const WithClearButton: Story = {
  args: {
    clearButton: true,
    value: '서울역',
  },
  render: (args) => <ControlledInputButton {...args} />,
};

export const Invalid: Story = {
  args: {
    invalid: true,
  },
};

export const InvalidPressed: Story = {
  args: {
    invalid: true,
  },
  parameters: {
    pseudo: { active: true },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: '읽기 전용 값',
  },
};
