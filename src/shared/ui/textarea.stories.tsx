import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

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

const allStates = [
  { key: 'enabled', label: 'Enabled', invalid: false, disabled: false, readOnly: false },
  { key: 'focused', label: 'Focused', invalid: false, disabled: false, readOnly: false },
  { key: 'error', label: 'Error', invalid: true, disabled: false, readOnly: false },
  { key: 'errorFocused', label: 'Error Focused', invalid: true, disabled: false, readOnly: false },
  { key: 'disabled', label: 'Disabled', invalid: false, disabled: true, readOnly: false },
  { key: 'readOnly', label: 'Read Only', invalid: false, disabled: false, readOnly: true },
] as const;

const allValues = [
  { key: 'empty', label: 'Empty', value: '' },
  {
    key: 'filled',
    label: 'Filled',
    value: '입력한 여러 줄의 텍스트입니다.\n두 번째 줄을 확인해 주세요.',
  },
] as const;

const allSizes = [
  { key: 'auto', label: 'Auto Size', autoSize: true },
  { key: 'fixed', label: 'Fixed Height', autoSize: false },
] as const;

type AllStatesState = (typeof allStates)[number]['key'];

const stateSurfaceClassNames: Record<AllStatesState, string | undefined> = {
  enabled: undefined,
  focused: '[&>div]:!border-2 [&>div]:!border-[var(--color-stroke-neutral-contrast)]',
  error: undefined,
  errorFocused: '[&>div]:!border-2 [&>div]:!border-[var(--color-stroke-critical-solid)]',
  disabled: undefined,
  readOnly: undefined,
};

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

function AllStatesPreview() {
  return (
    <div className="grid grid-cols-2 gap-x-[var(--dimension-x6)] gap-y-[var(--dimension-x3)]">
      {allStates.flatMap((state) =>
        allValues.flatMap((value) =>
          allSizes.map((size) => {
            const label = `${state.label} · ${value.label} · ${size.label}`;

            return (
              <div
                className="flex min-w-0 flex-col gap-[var(--dimension-x1)]"
                key={`${state.key}-${value.key}-${size.key}`}
              >
                <span className="leading-[var(--line-height-t3)] text-[var(--color-fg-neutral-muted)] text-[var(--font-size-t3)]">
                  {label}
                </span>
                <Textarea
                  aria-label={label}
                  autoSize={size.autoSize}
                  className={cn(stateSurfaceClassNames[state.key])}
                  disabled={state.disabled}
                  invalid={state.invalid}
                  onValueChange={() => {}}
                  placeholder="Placeholder"
                  readOnly={state.readOnly}
                  value={value.value}
                />
              </div>
            );
          }),
        ),
      )}
    </div>
  );
}

export const AllStates: Story = {
  render: () => <AllStatesPreview />,
};
