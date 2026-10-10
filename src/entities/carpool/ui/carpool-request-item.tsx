import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { Text } from '@/shared/ui/text';

import type {
  CarpoolRequestStatus,
  CarpoolSentRequest,
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

const formatDeparture = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));

export function CarpoolRequestItem({ request, onChatClick }: CarpoolRequestItemProps) {
  const chatRoomId = request.chat_room_id;
  const canOpenChat =
    request.status === 'ACCEPTED' && chatRoomId !== null && chatRoomId !== undefined;

  return (
    <li className="relative flex min-h-[104px] w-full items-center gap-3 px-4 py-4">
      <Avatar
        alt={`${request.counterpart.name} 프로필 이미지`}
        size="md"
        src={request.counterpart.profile_image_url}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <Text as="span" className="truncate" color="fg.neutral" variant="t4Bold">
            {request.counterpart.name}
          </Text>
          <Text
            as="span"
            className="shrink-0"
            color={request.status === 'ACCEPTED' ? 'fg.positive' : 'fg.neutralMuted'}
            variant="t7Regular"
          >
            {statusLabels[request.status]}
          </Text>
        </div>
        <Text as="span" className="mt-1 block truncate" color="fg.neutral" variant="t5Regular">
          {request.origin_name} → {request.dest_name}
        </Text>
        <Text
          as="span"
          className="mt-0.5 block truncate"
          color="fg.neutralMuted"
          variant="t7Regular"
        >
          {formatDeparture(request.departure_at)} 출발
        </Text>
      </div>
      {canOpenChat ? (
        <Button
          onClick={() => onChatClick(chatRoomId)}
          size="small"
          variant="brand-outline"
          width="hug"
        >
          채팅하기
        </Button>
      ) : null}
      <Divider
        aria-hidden="true"
        as="div"
        className="absolute right-0 bottom-0 left-0 !w-full"
        color="neutral-subtle"
      />
    </li>
  );
}
