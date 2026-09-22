import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon } from './icon';
import { Snackbar, type SnackbarVariant } from './snackbar';

const variants: SnackbarVariant[] = ['default', 'positive', 'critical'];

const meta = {
  title: 'Shared/Snackbar',
  component: Snackbar,
  parameters: {
    layout: 'padded',
  },
  args: {
    content: '메시지를 입력하세요',
    durationTime: 0,
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
    },
    durationTime: {
      control: {
        type: 'number',
        min: 0,
      },
      description: '자동 숨김 시간(ms). 0이면 숨기지 않습니다.',
    },
  },
} satisfies Meta<typeof Snackbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithAction: Story = {
  args: {
    actionButton: '확인',
    variant: 'default',
  },
};

export const Positive: Story = {
  args: {
    variant: 'positive',
  },
};

export const PositiveWithAction: Story = {
  args: {
    actionButton: '확인',
    variant: 'positive',
  },
};

export const Critical: Story = {
  args: {
    variant: 'critical',
  },
};

export const CriticalWithAction: Story = {
  args: {
    actionButton: '확인',
    variant: 'critical',
  },
};

export const CustomIcon: Story = {
  args: {
    icon: <Icon color="var(--color-fg-warning)" name="info" size={24} />,
    variant: 'default',
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-[var(--dimension-x3)]">
      {variants.flatMap((variant) => [
        <Snackbar {...args} key={`${variant}-none`} variant={variant} />,
        <Snackbar {...args} actionButton="확인" key={`${variant}-action`} variant={variant} />,
      ])}
    </div>
  ),
};
