import { cn } from '@/shared/lib/cn';

import type { CompanionPostDetail } from '@/entities/post/model/post-detail';
import { PostDetailInfoRow } from './post-detail-info-row';

export type MovementDetailInfoProps = Pick<
  CompanionPostDetail,
  'capacity' | 'current_count' | 'departure_at' | 'departure_location' | 'destination'
> & {
  className?: string;
};

function formatDepartureAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  const period = Number(values.hour) >= 12 ? '오후' : '오전';

  return `${values.year}/${values.month}/${values.day} ${values.hour}:${values.minute} (${period})`;
}

export function MovementDetailInfo({
  capacity,
  className,
  current_count,
  departure_at,
  departure_location,
  destination,
}: MovementDetailInfoProps) {
  return (
    <div className={cn('flex flex-col gap-2 px-6', className)}>
      <PostDetailInfoRow label="출발 시간" value={formatDepartureAt(departure_at)} />
      <PostDetailInfoRow label="출발지" value={departure_location} />
      <PostDetailInfoRow label="목적지" value={destination} />
      <PostDetailInfoRow label="현재 인원" value={`${current_count} / ${capacity}명`} />
    </div>
  );
}
