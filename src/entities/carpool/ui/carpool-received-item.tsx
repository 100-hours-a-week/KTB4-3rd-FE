import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { Text } from '@/shared/ui/text';

import type { CarpoolReceivedRequest } from '@/entities/carpool/model/carpool-request';

export type CarpoolReceivedItemProps = {
  request: CarpoolReceivedRequest;
  onRequestClick: (carpoolId: number, requestId: number) => void;
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

export function CarpoolReceivedItem({ request, onRequestClick }: CarpoolReceivedItemProps) {
  return (
    <li className="relative flex min-h-[104px] w-full items-center gap-3 px-4 py-4">
      <Avatar
        alt={`${request.counterpart.name} 프로필 이미지`}
        size="md"
        src={request.counterpart.profile_image_url}
      />
      <div className="min-w-0 flex-1">
        <Text as="span" className="block truncate" color="fg.neutral" variant="t4Bold">
          {request.counterpart.name}
        </Text>
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
      <Button
        onClick={() => onRequestClick(request.carpool_id, request.id)}
        size="small"
        variant="neutral-outline"
        width="hug"
      >
        요청 확인
      </Button>
      <Divider
        aria-hidden="true"
        as="div"
        className="absolute right-0 bottom-0 left-0 !w-full"
        color="neutral-subtle"
      />
    </li>
  );
}
