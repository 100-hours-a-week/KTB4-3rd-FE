import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  CarpoolReceivedItem,
  CarpoolRequestItem,
  CarpoolRequestTabs,
  ChatCarpoolTabs,
  type CarpoolReceivedRequest,
  type CarpoolSentRequest,
} from '@/entities/carpool';

const sentRequest: CarpoolSentRequest = {
  id: 88,
  carpool_id: 51,
  status: 'ACCEPTED',
  chat_room_id: 620,
  counterpart: { id: 7, name: '김우림', profile_image_url: null },
  origin_name: '판교역',
  dest_name: '강남역',
  departure_at: '2026-09-08T08:30:00.000Z',
  content: '판교역에서 같이 가고 싶습니다!',
  created_at: '2026-09-06T21:10:00.000Z',
};

const receivedRequest: CarpoolReceivedRequest = {
  ...sentRequest,
  id: 90,
  status: 'PENDING',
  counterpart: { id: 9, name: '이루디', profile_image_url: null },
};

const meta = {
  title: 'Entities/Carpool/Request components',
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[353px] bg-[var(--color-bg-layer-default)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChatCarpoolTabsStory: Story = {
  render: () => <ChatCarpoolTabs value="carpool" onValueChange={() => undefined} />,
};

export const CarpoolRequestTabsStory: Story = {
  render: () => (
    <div className="p-5">
      <CarpoolRequestTabs value="SENT" onValueChange={() => undefined} />
    </div>
  ),
};

export const SentRequestPending: Story = {
  render: () => (
    <ul>
      <CarpoolRequestItem
        request={{ ...sentRequest, status: 'PENDING', chat_room_id: undefined }}
        onChatClick={() => undefined}
      />
    </ul>
  ),
};

export const SentRequestAccepted: Story = {
  render: () => (
    <ul>
      <CarpoolRequestItem request={sentRequest} onChatClick={() => undefined} />
    </ul>
  ),
};

export const SentRequestStatuses: Story = {
  render: () => (
    <ul className="flex flex-col gap-3">
      <CarpoolRequestItem
        request={{ ...sentRequest, status: 'PENDING', chat_room_id: undefined }}
        onChatClick={() => undefined}
      />
      <CarpoolRequestItem request={sentRequest} onChatClick={() => undefined} />
      <CarpoolRequestItem
        request={{ ...sentRequest, status: 'EXPIRED', chat_room_id: null }}
        onChatClick={() => undefined}
      />
      <CarpoolRequestItem
        request={{ ...sentRequest, status: 'REJECTED', chat_room_id: null }}
        onChatClick={() => undefined}
      />
    </ul>
  ),
};

export const SentRequestAcceptedWithoutChat: Story = {
  render: () => (
    <ul>
      <CarpoolRequestItem
        request={{ ...sentRequest, chat_room_id: null }}
        onChatClick={() => undefined}
      />
    </ul>
  ),
};

export const ReceivedRequest: Story = {
  render: () => (
    <ul>
      <CarpoolReceivedItem request={receivedRequest} onRequestClick={() => undefined} />
    </ul>
  ),
};

export const ReceivedRequestLongRoute: Story = {
  render: () => (
    <ul>
      <CarpoolReceivedItem
        request={{
          ...receivedRequest,
          origin_name: '서울특별시 강남구 테헤란로 긴 출발지',
          dest_name: '경기도 성남시 분당구 판교역 긴 도착지',
        }}
        onRequestClick={() => undefined}
      />
    </ul>
  ),
};
