import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon, iconNames, type IconName } from './icon';

const meta = {
  title: 'Shared/Icon',
  component: Icon,
  parameters: {
    layout: 'padded',
  },
  args: {
    color: 'var(--color-fg-neutral)',
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

function IconGrid({ names }: { names: IconName[] }) {
  return (
    <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
      {names.map((name) => (
        <div className="flex flex-col items-center gap-2 text-center" key={name}>
          <Icon name={name} />
          <span className="text-xs text-slate-600">{name}</span>
        </div>
      ))}
    </div>
  );
}

export const Icons: Story = {
  args: {
    name: 'camera',
  },
  render: () => <IconGrid names={iconNames} />,
};

export const Colors: Story = {
  args: {
    name: 'checkmarkCircle',
  },
  render: () => (
    <div className="flex items-end gap-6">
      <Icon name="checkmarkCircle" color="var(--color-fg-positive)" />
      <Icon name="checkmarkCircle" color="var(--color-fg-informative)" />
      <Icon name="checkmarkCircle" color="var(--color-fg-critical)" />
    </div>
  ),
};

export const Playground: Story = {
  args: {
    name: 'camera',
    size: 24,
    color: '#1a1c20',
    title: '',
    'aria-label': '',
  },
  argTypes: {
    name: {
      control: 'select',
      options: iconNames,
    },
    size: {
      control: {
        type: 'number',
        min: 1,
      },
    },
    color: {
      control: 'color',
    },
    title: {
      control: 'text',
    },
    'aria-label': {
      control: 'text',
    },
  },
  render: (args) => (
    <div className="flex min-h-24 items-center justify-center">
      <Icon {...args} />
    </div>
  ),
};
