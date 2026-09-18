import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { Checkbox } from './checkbox';
import { Text } from './text';

const meta = {
  title: 'Shared/Checkbox',
  component: Checkbox,
  args: {
    label: '서비스 이용약관 동의',
    requirement: 'required',
    weight: 'regular',
    disabled: false,
  },
  argTypes: {
    requirement: {
      control: 'select',
      options: ['required', 'optional', null],
    },
    weight: {
      control: 'inline-radio',
      options: ['regular', 'bold'],
    },
    disabled: {
      control: 'boolean',
    },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledCheckbox(args: ComponentProps<typeof Checkbox>) {
  const [checked, setChecked] = useState(args.defaultChecked ?? false);

  return <Checkbox {...args} checked={checked} onCheckedChange={setChecked} />;
}

type CheckboxStateExample = {
  label: string;
  props?: Partial<ComponentProps<typeof Checkbox>>;
};

function CheckboxStateSection({
  examples,
  title,
}: {
  examples: CheckboxStateExample[];
  title: string;
}) {
  return (
    <section className="flex flex-col gap-[var(--dimension-x2)]">
      <Text as="h3" variant="t4Bold">
        {title}
      </Text>
      <div className="grid grid-cols-2 gap-x-[var(--dimension-x4)] gap-y-[var(--dimension-x2)]">
        {examples.map(({ label, props }) => (
          <Checkbox key={label} {...props} label={label} />
        ))}
      </div>
    </section>
  );
}

export const Playground: Story = {
  render: (args) => <ControlledCheckbox {...args} />,
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const OptionalBold: Story = {
  args: {
    requirement: 'optional',
    weight: 'bold',
  },
};

export const Disabled: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex w-full max-w-[720px] flex-col gap-[var(--dimension-x6)]">
      <CheckboxStateSection
        examples={[{ label: '미선택' }, { label: '선택됨', props: { defaultChecked: true } }]}
        title="기본 상태"
      />
      <CheckboxStateSection
        examples={[
          { label: '필수 · 미선택', props: { requirement: 'required' } },
          { label: '필수 · 선택됨', props: { defaultChecked: true, requirement: 'required' } },
          { label: '선택 · 미선택', props: { requirement: 'optional' } },
          { label: '선택 · 선택됨', props: { defaultChecked: true, requirement: 'optional' } },
        ]}
        title="요구사항"
      />
      <CheckboxStateSection
        examples={[
          { label: 'Regular · 미선택', props: { weight: 'regular' } },
          { label: 'Regular · 선택됨', props: { defaultChecked: true, weight: 'regular' } },
          { label: 'Bold · 미선택', props: { weight: 'bold' } },
          { label: 'Bold · 선택됨', props: { defaultChecked: true, weight: 'bold' } },
        ]}
        title="라벨 굵기"
      />
      <CheckboxStateSection
        examples={[
          { label: '비활성화 · 미선택', props: { disabled: true } },
          { label: '비활성화 · 선택됨', props: { defaultChecked: true, disabled: true } },
        ]}
        title="비활성화"
      />
    </div>
  ),
};
