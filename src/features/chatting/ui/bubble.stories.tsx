import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Bubble } from '@/features/chatting';

function LongMessageContent() {
  return (
    <>
      <p>
        쾌적한 탑승을 위해 <strong>'방장 결제 후 정산'</strong> 규칙을 적용하고 있어요.
      </p>
      <p>이동이 끝나면 동승자들에게 정산을 요청해 주세요.</p>
    </>
  );
}

const meta = {
  title: 'Features/Chatting/Bubble',
  component: Bubble,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="flex w-[353px] flex-col gap-4 bg-[var(--color-bg-layer-fill)] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Bubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SystemLoading: Story = {
  args: {
    children: '같이 갈 사람을 찾는 중이에요',
    loading: true,
    variant: 'system',
  },
};

export const SystemLong: Story = {
  args: {
    children: <LongMessageContent />,
    variant: 'system',
  },
};

export const Me: Story = {
  args: {
    children: '안녕하세요',
    variant: 'me',
  },
};

export const MeLong: Story = {
  args: {
    children: <LongMessageContent />,
    variant: 'me',
  },
};

export const Other: Story = {
  args: {
    children: '어디서 만나실건가요',
    variant: 'other',
  },
};

export const OtherLong: Story = {
  args: {
    children: <LongMessageContent />,
    variant: 'other',
  },
};

export const Variants: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <Bubble variant="system">시스템 안내 메시지</Bubble>
      <Bubble className="self-end" variant="me">
        내 메시지
      </Bubble>
      <Bubble variant="other">상대방 메시지</Bubble>
    </div>
  ),
};
