import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon } from './icon';
import { Button, type ButtonSize, type ButtonVariant } from './button';

const sizes: ButtonSize[] = ['xsmall', 'small', 'medium', 'large'];
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
  title: 'Shared/Button',
  component: Button,
  args: {
    children: '버튼',
    size: 'medium',
    variant: 'brand-solid',
    width: 'hug',
    loading: false,
    disabled: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
    },
    variant: {
      control: 'select',
      options: variants,
    },
    width: {
      control: 'select',
      options: ['hug', 'fill'],
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithPrefixIcon: Story = {
  args: {
    prefixIcon: <Icon name="plus" size={16} />,
  },
};

export const WithSuffixIcon: Story = {
  args: {
    suffixIcon: <Icon name="chevronRight" size={16} />,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const FillWidth: Story = {
  args: {
    width: 'fill',
  },
  parameters: {
    layout: 'padded',
  },
};

export const AllSizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {sizes.map((size) => (
        <Button {...args} key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-3">
      {variants.map((variant) => (
        <Button {...args} key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};
