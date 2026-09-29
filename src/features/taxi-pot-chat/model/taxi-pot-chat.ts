import type { ChatWebSocketMessage } from '@/entities/chat';
import type { TaxiPotDetailData } from '@/features/taxi-pot-chat/api/taxi-pot';

export type TaxiPotRideAction = 'start' | 'end';

const rideActionMessageTypes = new Set<ChatWebSocketMessage['type']>([
  'SYSTEM_RIDE_START_REQUESTED',
  'SYSTEM_RIDE_END_REQUESTED',
]);

const rideLifecycleMessageTypes = new Set<ChatWebSocketMessage['type']>([
  ...rideActionMessageTypes,
  'SYSTEM_RIDE_STARTED',
  'SYSTEM_RIDE_ENDED',
]);

export function isTaxiPotRideActionMessage(message: Pick<ChatWebSocketMessage, 'type'>): boolean {
  return rideActionMessageTypes.has(message.type);
}

export function getLatestTaxiPotRideAction(
  messages: readonly Pick<ChatWebSocketMessage, 'id' | 'type'>[],
): TaxiPotRideAction | undefined {
  let latestRideMessage: Pick<ChatWebSocketMessage, 'id' | 'type'> | undefined;

  for (const message of messages) {
    if (
      !rideLifecycleMessageTypes.has(message.type) ||
      (latestRideMessage !== undefined && message.id <= latestRideMessage.id)
    ) {
      continue;
    }

    latestRideMessage = message;
  }

  if (latestRideMessage?.type === 'SYSTEM_RIDE_START_REQUESTED') {
    return 'start';
  }

  if (latestRideMessage?.type === 'SYSTEM_RIDE_END_REQUESTED') {
    return 'end';
  }

  return undefined;
}

export type TaxiPotChatEntryMessage = {
  id: string;
  content: string;
  variant: 'system';
  layout?: 'default' | 'guide';
  loading?: boolean;
};

export function createTaxiPotChatEntryMessages(
  taxiPot: TaxiPotDetailData,
): TaxiPotChatEntryMessage[] {
  if (taxiPot.current_count !== 1) {
    return [];
  }

  return [
    {
      id: `taxi-pot-host-${taxiPot.id}`,
      content: '이번 매칭의 방장이 됐어요!',
      variant: 'system',
    },
    {
      id: `taxi-pot-payment-guide-${taxiPot.id}`,
      content:
        "쾌적한 탑승을 위해 '방장 결제 후 정산' 규칙을 적용하고 있어요.\n이동이 끝나면 동승자들에게 정산을 요청해 주세요.",
      variant: 'system',
      layout: 'guide',
    },
    {
      id: `taxi-pot-finding-${taxiPot.id}`,
      content: '같이 갈 사람을 찾는 중이에요',
      variant: 'system',
      loading: true,
    },
  ];
}
