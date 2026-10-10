import { memo } from 'react';

import { cn } from '@/shared/lib/cn';
import { Avatar } from '@/shared/ui/avatar';
import { Divider } from '@/shared/ui/divider';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

import type { CarPoolListItem } from '../model/carpool';

export type CarpoolItemProps = {
  carpool: CarPoolListItem;
  onClick: (carpoolId: number) => void;
  className?: string;
  showDivider?: boolean;
};

const departureTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Seoul',
});

export const CarpoolItem = memo(
  ({ carpool, onClick, className, showDivider = false }: CarpoolItemProps) => {
    const departureTime = departureTimeFormatter.format(new Date(carpool.departure_at));

    return (
      <li className={cn('relative h-[72px] w-full', className)}>
        <button
          className="flex h-full w-full min-w-0 appearance-none items-center border-0 bg-transparent px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-transparent-pressed)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)] active:bg-[var(--color-bg-transparent-selected)]"
          data-carpool-id={carpool.id}
          onClick={() => onClick(carpool.id)}
          type="button"
        >
          <Avatar
            alt={`${carpool.host.name} 프로필 이미지`}
            size={48}
            src={carpool.host.profile_image_url}
          />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 pl-3">
            <Text
              as="span"
              className="block truncate"
              color="fg.neutral"
              variant="t5Regular"
              whiteSpace="nowrap"
            >
              {carpool.origin_name} → {carpool.dest_name}
            </Text>
            <Text
              as="span"
              className="block truncate"
              color="fg.neutralSubtle"
              variant="t3Regular"
              whiteSpace="nowrap"
            >
              {departureTime} 출발 · {carpool.current_count}/{carpool.capacity}명 참여 중
            </Text>
          </span>
          <span className="ml-5 inline-flex size-[18px] shrink-0 items-center justify-center">
            <Icon name="chevronRight" size={18} color="var(--color-fg-neutral)" />
          </span>
        </button>
        {showDivider ? (
          <Divider
            aria-hidden="true"
            as="div"
            className="absolute inset-x-0 bottom-0 !w-auto"
            color="neutral-subtle"
            inset
          />
        ) : null}
      </li>
    );
  },
);
