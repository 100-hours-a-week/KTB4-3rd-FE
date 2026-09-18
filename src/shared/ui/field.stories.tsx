import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Button } from './button';
import { Field } from './field';
import { Input } from './input';
import { InputField } from './input-field';
import { Select, type SelectOption } from './select';

const transportOptions: SelectOption[] = [
  { value: 'taxi', label: '택시' },
  { value: 'car', label: '자차' },
  { value: 'subway', label: '지하철' },
];

const meta = {
  title: 'Shared/Field',
  component: Field,
  args: {
    label: '댓글',
    inputSlot: <Input aria-label="댓글" onValueChange={() => {}} value="" />,
    helperText: '최대 300자까지 입력할 수 있어요.',
  },
  argTypes: {
    labelWeight: {
      control: { type: 'inline-radio' },
      options: ['medium', 'bold'],
    },
    required: {
      control: 'boolean',
    },
    invalid: {
      control: 'boolean',
    },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

function InputFieldExample() {
  const [value, setValue] = useState('');

  return (
    <Field
      characterCount={value.length}
      helperText="최대 300자까지 입력할 수 있어요."
      inputSlot={
        <Input
          aria-label="댓글"
          maxLength={300}
          onValueChange={setValue}
          placeholder="댓글을 입력해 주세요"
          value={value}
        />
      }
      label="댓글"
      maxCharacterCount={300}
      required
    />
  );
}

function SelectFieldExample() {
  const [value, setValue] = useState<string | null>(null);

  return (
    <Field
      helperText="이동수단을 선택해 주세요."
      inputSlot={
        <Select
          onValueChange={setValue}
          options={transportOptions}
          placeholder="이동수단을 선택해 주세요"
          value={value}
        />
      }
      label="이동수단"
      requirementMark="optional"
    />
  );
}

export const InputSlot: Story = {
  render: () => <InputFieldExample />,
};

export const InputFieldWrapper: Story = {
  render: () => (
    <InputField
      helperText="최대 300자까지 입력할 수 있어요."
      label="댓글"
      onValueChange={() => {}}
      value=""
    />
  ),
};

export const SelectSlot: Story = {
  render: () => <SelectFieldExample />,
};

export const WithSuffixSlot: Story = {
  args: {
    suffixSlot: (
      <Button size="xsmall" variant="ghost">
        도움말
      </Button>
    ),
  },
};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const Optional: Story = {
  args: {
    requirementMark: 'optional',
  },
};

export const ErrorMessage: Story = {
  args: {
    errorMessage: '댓글을 입력해 주세요.',
    invalid: true,
  },
};

export const CharacterCount: Story = {
  args: {
    characterCount: 8,
    maxCharacterCount: 10,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
