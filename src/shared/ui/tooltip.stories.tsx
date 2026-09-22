import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon } from './icon';
import { Text } from './text';
import { Tooltip, type TooltipPosition } from './tooltip';

const positions: TooltipPosition[] = ['top', 'right', 'bottom', 'left'];

const positionMetadata = {
  top: { caption: '버튼 위', label: '상단', symbol: '↑' },
  right: { caption: '버튼 오른쪽', label: '오른쪽', symbol: '→' },
  bottom: { caption: '버튼 아래', label: '하단', symbol: '↓' },
  left: { caption: '버튼 왼쪽', label: '왼쪽', symbol: '←' },
} satisfies Record<TooltipPosition, { caption: string; label: string; symbol: string }>;

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
    <div className="w-full max-w-[560px] rounded-[24px] border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-layer-fill)] p-5">
      <div className="mb-5">
        <Text as="h2" color="fg.neutral" variant="t3Bold">
          Tooltip 위치
        </Text>
        <Text as="p" color="fg.neutralMuted" variant="t6Regular">
          아이콘을 기준으로 메시지가 표시되는 방향을 확인해 보세요.
        </Text>
      </div>

      <div className="flex flex-col gap-3">
        {positions.map((position) => {
          const { caption, label, symbol } = positionMetadata[position];

          return (
            <div
              className="flex min-h-[112px] items-stretch gap-4 rounded-[16px] border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-layer-default)] p-3"
              key={position}
            >
              <div className="flex w-[104px] shrink-0 flex-col justify-center gap-1">
                <span className="mb-1 inline-flex size-8 items-center justify-center rounded-full bg-[var(--color-bg-neutral-weak)] text-[18px] leading-none text-[var(--color-fg-neutral-muted)]">
                  {symbol}
                </span>
                <Text as="p" color="fg.neutral" variant="t5Bold">
                  {label}
                </Text>
                <Text as="p" color="fg.neutralMuted" variant="t7Regular">
                  {caption}
                </Text>
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-center rounded-[12px] bg-[var(--color-bg-layer-fill)] px-10">
                <Tooltip {...args} position={position}>
                  <InfoButton />
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>

      <Text as="p" color="fg.neutralMuted" className="mt-4 text-center" variant="t7Regular">
        모든 예시는 동일한 메시지와 아이콘 버튼을 사용합니다.
      </Text>
    </div>
  ),
};
