import { cn } from '@/shared/lib/cn';

import type { CompanionPostDetail } from '@/entities/post/model/post-detail';
import { PostDetailInfoRow } from './post-detail-info-row';

export type MovementDetailInfoProps = Pick<
  CompanionPostDetail,
  'capacity' | 'current_count' | 'departure_at' | 'departure_location' | 'destination'
> & {
  className?: string;
  layout?: 'modal' | 'page';
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
  layout = 'modal',
}: MovementDetailInfoProps) {
  const isPageLayout = layout === 'page';

  return (
    <div
      className={cn(
        'flex flex-col',
        isPageLayout ? 'ml-7 w-[325px] gap-4 pt-4' : 'gap-2 px-6',
        className,
      )}
    >
      <PostDetailInfoRow
        layout={layout}
        label="출발 시간"
        value={formatDepartureAt(departure_at)}
      />
      <PostDetailInfoRow layout={layout} label="출발지" value={departure_location} />
      <PostDetailInfoRow layout={layout} label="목적지" value={destination} />
      <PostDetailInfoRow
        layout={layout}
        label="현재 인원"
        value={`${current_count} / ${capacity}명`}
      />
    </div>
  );
}
