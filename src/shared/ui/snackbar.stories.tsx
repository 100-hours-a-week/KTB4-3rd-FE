import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Button } from './button';
import { Icon } from './icon';
import { Snackbar, type SnackbarType } from './snackbar';

const types: SnackbarType[] = ['default', 'positive', 'critical'];

const meta = {
  title: 'Shared/Snackbar',
  component: Snackbar,
  parameters: {
    layout: 'padded',
  },
  args: {
    description: '메시지를 입력하세요',
    timeout: 0,
    type: 'default',
  },
  argTypes: {
    type: {
      control: 'select',
      options: types,
    },
    timeout: {
      control: {
        type: 'number',
        min: 0,
      },
      description: 'Base UI Toast timeout(ms). 0이면 숨기지 않습니다.',
    },
  },
} satisfies Meta<typeof Snackbar>;

export default meta;

type Story = StoryObj<typeof meta>;

function TriggeredByButtonStory() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-[var(--dimension-x5)]">
      <Snackbar
        actionProps={{ children: '확인', onClick: () => setOpen(false) }}
        description="버튼을 눌러 Snackbar가 표시되었습니다."
        onOpenChange={setOpen}
        open={open}
        timeout={3000}
        type="positive"
      />

      <Button onClick={() => setOpen(true)}>Snackbar 열기</Button>
    </div>
  );
}

export const Playground: Story = {};

export const WithAction: Story = {
  args: {
    actionProps: { children: '확인' },
    type: 'default',
  },
};

export const Positive: Story = {
  args: {
    type: 'positive',
  },
};

export const PositiveWithAction: Story = {
  args: {
    actionProps: { children: '확인' },
    type: 'positive',
  },
};

export const Critical: Story = {
  args: {
    type: 'critical',
  },
};

export const CriticalWithAction: Story = {
  args: {
    actionProps: { children: '확인' },
    type: 'critical',
  },
};

export const CustomIcon: Story = {
  args: {
    icon: <Icon color="var(--color-fg-warning)" name="info" size={24} />,
    type: 'default',
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-[var(--dimension-x3)]">
      {types.flatMap((type) => [
        <Snackbar {...args} key={`${type}-none`} type={type} />,
        <Snackbar
          {...args}
          actionProps={{ children: '확인' }}
          key={`${type}-action`}
          type={type}
        />,
      ])}
    </div>
  ),
};

export const TriggeredByButton: Story = {
  parameters: {
    layout: 'centered',
  },
  render: () => <TriggeredByButtonStory />,
};
