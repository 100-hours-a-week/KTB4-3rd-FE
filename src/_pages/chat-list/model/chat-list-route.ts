import type { CarpoolRequestDirection, ChatCarpoolTab } from '@/entities/carpool';

export type ChatListRouteParams = {
  direction?: string | string[];
  tab?: string | string[];
};

export type ChatListRouteState = {
  chatTab: ChatCarpoolTab;
  requestDirection: CarpoolRequestDirection;
};

function firstParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseChatListRouteState(params: ChatListRouteParams): ChatListRouteState {
  return {
    chatTab: firstParamValue(params.tab) === 'carpool' ? 'carpool' : 'chat',
    requestDirection: firstParamValue(params.direction) === 'RECEIVED' ? 'RECEIVED' : 'SENT',
  };
}
