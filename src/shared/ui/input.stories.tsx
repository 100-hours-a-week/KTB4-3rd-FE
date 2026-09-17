import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { Icon } from './icon';
import { Input, type InputSize } from './input';

const sizes: InputSize[] = ['sm', 'md', 'lg'];

const meta = {
  title: 'Shared/Input',
  component: Input,
  args: {
    'aria-label': '계좌번호',
    value: '',
    onValueChange: () => {},
    placeholder: '계좌번호를 입력해주세요',
    size: 'lg',
    disabled: false,
    readOnly: false,
    invalid: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
    },
    invalid: {
      control: 'boolean',
    },
    clearButton: {
      control: 'boolean',
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledInput(args: ComponentProps<typeof Input>) {
  const [value, setValue] = useState(args.value);

  return <Input {...args} onValueChange={setValue} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledInput {...args} />,
};

export const WithPrefix: Story = {
  render: (args) => (
    <ControlledInput {...args} prefix={<Icon aria-hidden="true" name="person2Line" size={20} />} />
  ),
};

export const WithSuffix: Story = {
  render: (args) => <ControlledInput {...args} suffix="원" />,
};

export const WithClearButton: Story = {
  args: {
    value: '계좌번호',
    clearButton: true,
  },
  render: (args) => <ControlledInput {...args} />,
};

export const Invalid: Story = {
  args: {
    invalid: true,
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const AllSizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      {sizes.map((size) => (
        <Input {...args} key={size} size={size} />
      ))}
    </div>
  ),
};
