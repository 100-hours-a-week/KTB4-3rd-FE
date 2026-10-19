import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Text, type TextColor } from '@/shared/ui/text';

import {
  CARPOOL_REQUEST_AVATAR_PLACEHOLDER_SRC,
  type CarpoolRequestStatus,
  type CarpoolSentRequest,
} from '@/entities/carpool/model/carpool-request';

export type CarpoolRequestItemProps = {
  request: CarpoolSentRequest;
  onChatClick: (chatRoomId: number) => void;
};

const statusLabels: Record<CarpoolRequestStatus, string> = {
  PENDING: '대기중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  EXPIRED: '만료됨',
};

const statusColors: Record<CarpoolRequestStatus, TextColor> = {
  PENDING: 'fg.warning',
  ACCEPTED: 'fg.positive',
  REJECTED: 'fg.critical',
  EXPIRED: 'fg.neutralMuted',
};

export function CarpoolRequestItem({ request, onChatClick }: CarpoolRequestItemProps) {
  const chatRoomId = request.chat_room_id;
  const canOpenChat =
    request.status === 'ACCEPTED' && chatRoomId !== null && chatRoomId !== undefined;

  return (
    <li className="relative h-[84px] w-full shrink-0 list-none rounded-2xl border border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-layer-default)]">
      <div className="flex h-full items-center gap-4 px-4 py-[17px]">
        <Avatar
          alt={`${request.counterpart.name} 프로필 이미지`}
          className={request.counterpart.profile_image_url ? undefined : '!border-0'}
          size={48}
          src={request.counterpart.profile_image_url ?? CARPOOL_REQUEST_AVATAR_PLACEHOLDER_SRC}
        />
        <div className="min-w-0 flex-1">
          <Text as="span" className="block truncate" color="fg.neutral" variant="t5Regular">
            {request.counterpart.name}
          </Text>
          <Text
            as="span"
            className="mt-1 block truncate"
            color="fg.neutralMuted"
            variant="t4Regular"
          >
            {request.origin_name} → {request.dest_name}
          </Text>
        </div>
      </div>
      <Text
        as="span"
        className="absolute top-3 right-6 whitespace-nowrap"
        color={statusColors[request.status]}
        variant="t3Bold"
      >
        {statusLabels[request.status]}
      </Text>
      {canOpenChat ? (
        <Button
          className="absolute right-3 bottom-3 !rounded-full"
          onClick={() => onChatClick(chatRoomId)}
          size="xsmall"
          textVariant="t2Bold"
          variant="brand-outline"
          width="hug"
        >
          채팅하기
        </Button>
      ) : null}
    </li>
  );
}
