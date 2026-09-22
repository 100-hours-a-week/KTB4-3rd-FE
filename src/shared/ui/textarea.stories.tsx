import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { Field } from './field';
import { Textarea } from './textarea';

const meta = {
  title: 'Shared/Textarea',
  component: Textarea,
  args: {
    'aria-label': '댓글',
    value: '',
    onValueChange: () => {},
    placeholder: '댓글을 입력해 주세요',
    autoSize: true,
    disabled: false,
    readOnly: false,
    invalid: false,
  },
  argTypes: {
    autoSize: {
      control: 'boolean',
    },
    invalid: {
      control: 'boolean',
    },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledTextarea(args: ComponentProps<typeof Textarea>) {
  const [value, setValue] = useState(args.value);

  return <Textarea {...args} onValueChange={setValue} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledTextarea {...args} />,
};

export const Filled: Story = {
  args: {
    value: '입력한 여러 줄의 텍스트입니다.\n두 번째 줄을 확인해 주세요.',
  },
  render: (args) => <ControlledTextarea {...args} />,
};

export const FixedHeight: Story = {
  args: {
    autoSize: false,
  },
  render: (args) => <ControlledTextarea {...args} />,
};

export const Focused: Story = {
  args: {
    autoFocus: true,
  },
  render: (args) => <ControlledTextarea {...args} />,
};

export const Invalid: Story = {
  args: {
    invalid: true,
  },
  render: (args) => <ControlledTextarea {...args} />,
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: '읽기 전용으로 표시되는 여러 줄의 텍스트입니다.',
  },
  render: (args) => <ControlledTextarea {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: '비활성화된 여러 줄의 텍스트입니다.',
  },
  render: (args) => <ControlledTextarea {...args} />,
};

export const WithField: Story = {
  render: (args) => (
    <Field
      characterCount={args.value.length}
      helperText="최대 300자까지 입력할 수 있어요."
      inputSlot={<ControlledTextarea {...args} aria-label={undefined} />}
      label="댓글"
      maxCharacterCount={300}
      required
    />
  ),
};
