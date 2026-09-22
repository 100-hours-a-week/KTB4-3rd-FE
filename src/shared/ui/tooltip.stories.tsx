import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon } from './icon';
import { Tooltip, type TooltipPosition } from './tooltip';

const positions: TooltipPosition[] = ['top', 'right', 'bottom', 'left'];

function InfoButton() {
  return (
    <button
      aria-label="탑승인원 안내"
      className="inline-flex size-10 items-center justify-center rounded-full text-[var(--color-fg-neutral-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
      type="button"
    >
      <Icon name="info" size={16} />
    </button>
  );
}

const meta = {
  title: 'Shared/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: <InfoButton />,
    message: '탑승인원은 본인 제외예요.',
    position: 'top',
    align: 'center',
    initialDisplayDuration: 60_000,
  },
  argTypes: {
    position: {
      control: 'select',
      options: positions,
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Positions: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-24 p-24">
      {positions.map((position) => (
        <Tooltip {...args} key={position} position={position}>
          <InfoButton />
        </Tooltip>
      ))}
    </div>
  ),
};
