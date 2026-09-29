import type { MouseEventHandler } from 'react';

import { cn } from '@/shared/lib/cn';
import { Divider } from '@/shared/ui/divider';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

import type { CompanionTransport, Post } from '@/entities/post/model/post';

export type PostItemProps = {
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  post: Post;
  showDivider?: boolean;
};

const categoryLabel = {
  COMPANION: '동행',
  COMMUNITY: '커뮤',
} as const;

const categoryBackground = {
  COMPANION: 'bg-[var(--color-stroke-positive-weak)]',
  COMMUNITY: 'bg-[var(--color-stroke-informative-weak)]',
} as const;

const transportLabel: Record<CompanionTransport, string> = {
  OWNED_CAR: '자차',
  TAXI: '택시',
  SUBWAY: '지하철',
  BUS: '버스',
};

function formatDistance(distanceM: number) {
  if (distanceM < 1000) {
    return `${Math.round(distanceM)}m`;
  }

  const distanceKm = distanceM / 1000;
  return `${distanceKm.toFixed(1).replace(/\.0$/, '')}km`;
}

function formatDepartureTime(departureAt: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Seoul',
  }).format(new Date(departureAt));
}

function getPostMeta(post: Post) {
  if (post.type === 'COMPANION') {
    return [
      transportLabel[post.transport_type],
      formatDistance(post.distance_m),
      `${formatDepartureTime(post.departure_at)} 출발`,
      `${post.current_count}/${post.capacity}명 참여 중`,
    ].join(' · ');
  }

  return ['커뮤니티', formatDistance(post.distance_m), `댓글 ${post.comment_count}개`].join(' · ');
}

function PostCategoryBadge({ type }: { type: Post['type'] }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-12 shrink-0 items-center justify-center rounded-full',
        categoryBackground[type],
      )}
    >
      <Text as="span" color="fg.neutralInverted" variant="t3Bold">
        {categoryLabel[type]}
      </Text>
    </span>
  );
}

export function PostItem({ className, onClick, post, showDivider = false }: PostItemProps) {
  return (
    <li className={cn('relative h-[72px] w-full', className)}>
      <button
        className="group flex h-full w-full min-w-0 appearance-none items-center border-0 bg-transparent px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-transparent-pressed)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)] active:bg-[var(--color-bg-transparent-selected)]"
        data-post-id={post.id}
        data-post-type={post.type}
        onClick={onClick}
        type="button"
      >
        <PostCategoryBadge type={post.type} />

        <span className="min-w-0 flex-1 pl-3">
          <Text
            as="span"
            className="block truncate"
            color="fg.neutral"
            variant="t5Regular"
            whiteSpace="nowrap"
          >
            {post.title}
          </Text>
          <Text
            as="span"
            className="block truncate"
            color="fg.neutralSubtle"
            variant="t3Regular"
            whiteSpace="nowrap"
          >
            {getPostMeta(post)}
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
          className="absolute bottom-0 left-0"
          color="neutral-subtle"
          inset
        />
      ) : null}
    </li>
  );
}
