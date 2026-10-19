import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import {
  CARPOOL_REQUEST_AVATAR_PLACEHOLDER_SRC,
  type CarpoolReceivedRequest,
} from '@/entities/carpool/model/carpool-request';

export type CarpoolReceivedItemProps = {
  request: CarpoolReceivedRequest;
  onRequestClick: (carpoolId: number, requestId: number) => void;
  onDecisionClick: (carpoolId: number, requestId: number, action: 'accept' | 'reject') => void;
};

export function CarpoolReceivedItem({
  request,
  onDecisionClick,
  onRequestClick,
}: CarpoolReceivedItemProps) {
  const handleRequestClick = () => onRequestClick(request.carpool_id, request.id);

  return (
    <li className="relative h-[84px] w-full shrink-0 list-none rounded-2xl border border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-layer-default)]">
      <button
        aria-label={`${request.counterpart.name}님의 카풀 요청 상세 보기`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
        onClick={handleRequestClick}
        type="button"
      />
      <div className="pointer-events-none relative z-0 flex h-full items-center gap-4 px-4 py-[17px]">
        <Avatar
          alt={`${request.counterpart.name} 프로필 이미지`}
          className={request.counterpart.profile_image_url ? undefined : '!border-0'}
          size={48}
          src={request.counterpart.profile_image_url ?? CARPOOL_REQUEST_AVATAR_PLACEHOLDER_SRC}
        />
        <div className="min-w-0 flex-1 pr-[132px]">
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
      <div className="absolute right-3.5 bottom-3.5 z-10 flex items-center gap-2.5">
        <Button
          className="!rounded-[10px]"
          onClick={() => onDecisionClick(request.carpool_id, request.id, 'accept')}
          size="small"
          variant="brand-solid"
          width="hug"
        >
          수락
        </Button>
        <Button
          className="!rounded-[10px]"
          onClick={() => onDecisionClick(request.carpool_id, request.id, 'reject')}
          size="small"
          variant="neutral-weak"
          width="hug"
        >
          거절
        </Button>
      </div>
    </li>
  );
}
