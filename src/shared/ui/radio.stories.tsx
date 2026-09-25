import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { Radio, type RadioSelectionColor, type RadioSize, type RadioWeight } from './radio';
import { Text } from './text';

const sizes: RadioSize[] = ['medium', 'large'];
const weights: RadioWeight[] = ['regular', 'bold'];
const selectionColors: RadioSelectionColor[] = ['figma', 'brand'];

const meta = {
  title: 'Shared/Radio',
  component: Radio,
  args: {
    label: 'Radio option',
    size: 'medium',
    weight: 'regular',
    selectionColor: 'figma',
    disabled: false,
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: sizes,
    },
    weight: {
      control: 'inline-radio',
      options: weights,
    },
    selectionColor: {
      control: 'inline-radio',
      options: selectionColors,
    },
    disabled: {
      control: 'boolean',
    },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledRadio(args: ComponentProps<typeof Radio>) {
  const [checked, setChecked] = useState(args.checked ?? args.defaultChecked ?? false);

  return <Radio {...args} checked={checked} onCheckedChange={setChecked} />;
}

type RadioStateExample = {
  label: string;
  props?: Partial<ComponentProps<typeof Radio>>;
};

function RadioStateSection({ examples, title }: { examples: RadioStateExample[]; title: string }) {
  return (
    <section className="flex flex-col gap-[var(--dimension-x2)]">
      <Text as="h3" variant="t4Bold">
        {title}
      </Text>
      <div className="grid grid-cols-2 gap-x-[var(--dimension-x4)] gap-y-[var(--dimension-x2)]">
        {examples.map(({ label, props }) => (
          <Radio key={label} {...props} label={label} />
        ))}
      </div>
    </section>
  );
}

export const Playground: Story = {
  render: (args) => <ControlledRadio {...args} />,
};

export const Selected: Story = {
  args: {
    defaultChecked: true,
  },
};

export const BrandSelection: Story = {
  args: {
    defaultChecked: true,
    selectionColor: 'brand',
  },
};

export const Disabled: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
};

export const Group: Story = {
  render: (args) => (
    <div className="flex flex-col gap-[var(--dimension-x2)]">
      <Radio {...args} defaultChecked name="transport" label="대중교통" value="public" />
      <Radio {...args} name="transport" label="자차" value="car" />
      <Radio {...args} name="transport" label="도보" value="walk" />
    </div>
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="flex w-full max-w-[720px] flex-col gap-[var(--dimension-x6)]">
      <RadioStateSection
        examples={[{ label: '미선택' }, { label: '선택됨', props: { defaultChecked: true } }]}
        title="Medium · Regular"
      />
      <RadioStateSection
        examples={[
          { label: '미선택', props: { weight: 'bold' } },
          { label: '선택됨', props: { defaultChecked: true, weight: 'bold' } },
        ]}
        title="Medium · Bold"
      />
      <RadioStateSection
        examples={[
          { label: '미선택', props: { size: 'large' } },
          { label: '선택됨', props: { defaultChecked: true, size: 'large' } },
        ]}
        title="Large · Regular"
      />
      <RadioStateSection
        examples={[
          { label: '미선택', props: { size: 'large', weight: 'bold' } },
          {
            label: '선택됨',
            props: { defaultChecked: true, size: 'large', weight: 'bold' },
          },
        ]}
        title="Large · Bold"
      />
      <RadioStateSection
        examples={[
          { label: '비활성화 · 미선택', props: { disabled: true } },
          { label: '비활성화 · 선택됨', props: { defaultChecked: true, disabled: true } },
        ]}
        title="Disabled"
      />
    </div>
  ),
};
