import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon } from './icon';
import { Fab } from './fab';
import { type ButtonVariant } from './button';

const variants: ButtonVariant[] = [
  'neutral-solid',
  'brand-solid',
  'neutral-weak',
  'brand-outline',
  'neutral-outline',
  'critical-solid',
  'ghost',
];

const meta = {
  title: 'Shared/FAB',
  component: Fab,
  args: {
    children: '글쓰기',
    leftSlot: <Icon name="plus" size={22} />,
    variant: 'brand-solid',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Fab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithRightSlot: Story = {
  args: {
    leftSlot: undefined,
    rightSlot: <Icon name="chevronRight" size={22} />,
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-3">
      {variants.map((variant) => (
        <Fab {...args} key={variant} variant={variant}>
          {variant}
        </Fab>
      ))}
    </div>
  ),
};
