import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import {
  Radio,
  RadioGroup,
  type RadioSelectionColor,
  type RadioSize,
  type RadioWeight,
} from './radio';
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
    value: 'option',
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
  const [value, setValue] = useState(args.value);

  return (
    <RadioGroup onValueChange={setValue} value={value}>
      <Radio {...args} />
    </RadioGroup>
  );
}

function SingleRadio({
  selected = false,
  ...args
}: ComponentProps<typeof Radio> & { selected?: boolean }) {
  return (
    <RadioGroup defaultValue={selected ? args.value : undefined}>
      <Radio {...args} />
    </RadioGroup>
  );
}

type RadioStateExample = {
  label: string;
  props?: Partial<Omit<ComponentProps<typeof Radio>, 'label' | 'value'>>;
  selected?: boolean;
};

function RadioStateSection({ examples, title }: { examples: RadioStateExample[]; title: string }) {
  return (
    <section className="flex flex-col gap-[var(--dimension-x2)]">
      <Text as="h3" variant="t4Bold">
        {title}
      </Text>
      <div className="grid grid-cols-2 gap-x-[var(--dimension-x4)] gap-y-[var(--dimension-x2)]">
        {examples.map(({ label, props, selected }) => (
          <SingleRadio {...props} key={label} label={label} selected={selected} value="option" />
        ))}
      </div>
    </section>
  );
}

export const Playground: Story = {
  render: (args) => <ControlledRadio {...args} />,
};

export const Selected: Story = {
  render: (args) => <SingleRadio {...args} selected />,
};

export const BrandSelection: Story = {
  args: {
    selectionColor: 'brand',
  },
  render: (args) => <SingleRadio {...args} selected />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <SingleRadio {...args} selected />,
};

export const Group: Story = {
  render: (args) => (
    <RadioGroup defaultValue="public" className="gap-[var(--dimension-x2)]">
      <Radio {...args} label="대중교통" value="public" />
      <Radio {...args} label="자차" value="car" />
      <Radio {...args} label="도보" value="walk" />
    </RadioGroup>
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="flex w-full max-w-[720px] flex-col gap-[var(--dimension-x6)]">
      <RadioStateSection
        examples={[{ label: '미선택' }, { label: '선택됨', selected: true }]}
        title="Medium · Regular"
      />
      <RadioStateSection
        examples={[
          { label: '미선택', props: { weight: 'bold' } },
          { label: '선택됨', props: { weight: 'bold' }, selected: true },
        ]}
        title="Medium · Bold"
      />
      <RadioStateSection
        examples={[
          { label: '미선택', props: { size: 'large' } },
          { label: '선택됨', props: { size: 'large' }, selected: true },
        ]}
        title="Large · Regular"
      />
      <RadioStateSection
        examples={[
          { label: '미선택', props: { size: 'large', weight: 'bold' } },
          {
            label: '선택됨',
            props: { size: 'large', weight: 'bold' },
            selected: true,
          },
        ]}
        title="Large · Bold"
      />
      <RadioStateSection
        examples={[
          { label: '비활성화 · 미선택', props: { disabled: true } },
          { label: '비활성화 · 선택됨', props: { disabled: true }, selected: true },
        ]}
        title="Disabled"
      />
    </div>
  ),
};
