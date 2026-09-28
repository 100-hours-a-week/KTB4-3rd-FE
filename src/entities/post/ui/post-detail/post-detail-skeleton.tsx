import { cn } from '@/shared/lib/cn';
import { Divider } from '@/shared/ui/divider';
import { Icon } from '@/shared/ui/icon';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

import type { PostType } from '@/entities/post/model/post';

export type PostDetailSkeletonProps = {
  className?: string;
  layout?: 'modal' | 'page';
  type?: PostType;
};

const postTypeLabels: Record<PostType, string> = {
  COMPANION: '동행 모집',
  COMMUNITY: '커뮤니티',
};

const MOVEMENT_LABELS = ['출발 시간', '출발지', '목적지', '현재 인원'];

function CompanionActionPlaceholder({ layout }: Pick<PostDetailSkeletonProps, 'layout'>) {
  const isPageLayout = layout === 'page';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex h-11 w-full items-center justify-center rounded-[22px] bg-[var(--color-bg-brand-solid)]',
        isPageLayout && 'h-[52px] rounded-[8px]',
      )}
    >
      <Text color="fg.neutralInverted" variant="t4Bold">
        채팅 참여하기
      </Text>
    </div>
  );
}

function PostTypeSkeleton({ type }: Pick<PostDetailSkeletonProps, 'type'>) {
  return type ? (
    <Text color="fg.brand" variant="t3Bold">
      {postTypeLabels[type]}
    </Text>
  ) : (
    <Skeleton className="h-[18px] w-[68px]" />
  );
}

function PostHeaderSkeleton({
  layout,
  type,
}: Required<Pick<PostDetailSkeletonProps, 'layout'>> & Pick<PostDetailSkeletonProps, 'type'>) {
  const isPageLayout = layout === 'page';

  return (
    <header
      className={cn('flex flex-col', isPageLayout ? 'px-7 pt-[38px]' : 'px-6 pt-[14px] pb-5')}
    >
      <PostTypeSkeleton type={type} />
      <Skeleton
        className={cn(
          isPageLayout ? 'mt-[15px] h-[30px] w-[312px]' : 'mt-[18px] h-[22px] w-[232px]',
        )}
      />
      <Skeleton
        className={cn(
          isPageLayout ? 'mt-[49px] h-[22px] w-[318px]' : 'mt-[13px] h-[18px] w-[212px]',
        )}
      />
      {!isPageLayout && type === 'COMMUNITY' ? (
        <Skeleton className="mt-[18px] h-6 w-[50px] self-end rounded-full" />
      ) : null}
      {!isPageLayout && type !== 'COMMUNITY' ? (
        <Skeleton className="mt-[16px] h-6 w-[50px] rounded-full" />
      ) : null}
    </header>
  );
}

function MovementSkeleton({ layout }: Pick<PostDetailSkeletonProps, 'layout'>) {
  const isPageLayout = layout === 'page';
  const valueWidths = isPageLayout
    ? ['w-[156px]', 'w-[156px]', 'w-[156px]', 'w-[55px]']
    : valueWidthsForModal;

  return (
    <div className={cn('flex flex-col', isPageLayout ? 'ml-7 w-[325px] gap-4 pt-4' : 'gap-2 px-6')}>
      {MOVEMENT_LABELS.map((label, index) => (
        <div
          className={cn(
            'flex items-center justify-between gap-4',
            isPageLayout && 'grid h-5 grid-cols-[105px_206px] items-start gap-[14px]',
          )}
          key={label}
        >
          <Text
            className={isPageLayout ? '!leading-5' : undefined}
            color="fg.neutralMuted"
            variant={isPageLayout ? 't5Regular' : 't4Regular'}
          >
            {label}
          </Text>
          <Skeleton className={cn(isPageLayout ? '!h-[18px]' : 'h-[18px]', valueWidths[index])} />
        </div>
      ))}
    </div>
  );
}

const valueWidthsForModal = ['w-[156px]', 'w-[156px]', 'w-[156px]', 'w-[55px]'];

function CompanionPostDetailSkeleton({
  layout,
  type,
}: Required<Pick<PostDetailSkeletonProps, 'layout'>> & Pick<PostDetailSkeletonProps, 'type'>) {
  const isPageLayout = layout === 'page';

  return (
    <article
      aria-busy="true"
      aria-label="동행 모집 게시글 상세를 불러오는 중"
      className={cn(isPageLayout && 'min-h-[calc(100dvh-56px)] pb-[112px]')}
      data-testid={`post-detail-skeleton-${layout}`}
      role="status"
    >
      <PostHeaderSkeleton layout={layout} type={type} />
      {isPageLayout ? <Skeleton className="mx-7 mt-[26px] h-6 w-[50px] rounded-full" /> : null}
      <Divider
        className={isPageLayout ? 'mt-[37px]' : 'mt-0'}
        color={isPageLayout ? 'var(--color-stroke-neutral-weak)' : 'neutral-subtle'}
        inset={isPageLayout}
      />
      <MovementSkeleton layout={layout} />
      <Divider
        className={isPageLayout ? 'mt-4' : 'my-5'}
        color={isPageLayout ? 'var(--color-stroke-neutral-weak)' : 'neutral-subtle'}
        inset={isPageLayout}
      />
      {isPageLayout ? (
        <section className="ml-7 flex w-[325px] flex-col gap-[5px] pt-[26px]">
          <Text className="!leading-[18px]" color="fg.neutral" variant="t4Bold">
            참여자
          </Text>
          <div className="flex gap-4">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </section>
      ) : null}
      <div
        className={cn(
          'px-6 pb-6',
          isPageLayout &&
            'fixed bottom-[calc(32px+env(safe-area-inset-bottom,0px))] left-1/2 z-20 w-[calc(100%-40px)] max-w-[353px] -translate-x-1/2 px-0 pb-0',
        )}
      >
        <CompanionActionPlaceholder layout={layout} />
      </div>
    </article>
  );
}

function CommunityPostDetailSkeleton({
  layout,
  type,
}: Required<Pick<PostDetailSkeletonProps, 'layout'>> & Pick<PostDetailSkeletonProps, 'type'>) {
  const isPageLayout = layout === 'page';

  return (
    <article
      aria-busy="true"
      aria-label="커뮤니티 게시글 상세를 불러오는 중"
      className={cn(isPageLayout && 'min-h-[calc(100dvh-56px)] pb-[72px]')}
      data-testid={`post-detail-skeleton-${layout}`}
      role="status"
    >
      <PostHeaderSkeleton layout={layout} type={type} />
      <div className={cn('flex items-center', isPageLayout ? 'mx-7 mt-[28px]' : 'mx-6 mt-[18px]')}>
        <Icon
          aria-hidden="true"
          color="var(--color-fg-neutral-muted)"
          name="messageSquare"
          size={18}
        />
      </div>
      <div className={cn('mt-4 flex flex-col', isPageLayout ? 'mx-7' : 'mx-6')}>
        {Array.from({ length: 3 }, (_, index) => (
          <div
            className="flex h-[72px] items-center gap-3 border-b border-[var(--color-stroke-neutral-subtle)]"
            key={index}
          >
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-[50px] rounded-full" />
              <Skeleton className="h-[18px] w-[101px] rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className={cn(
          'relative mx-6 mt-4 h-11 w-[calc(100%-3rem)] rounded-[22px] bg-[var(--color-bg-neutral-weak)]',
          isPageLayout && 'sticky bottom-0 mt-4',
        )}
      >
        <Text
          className="absolute top-1/2 left-4 -translate-y-1/2"
          color="fg.neutralMuted"
          variant="t4Regular"
        >
          댓글을 입력해 주세요
        </Text>
        <Icon
          aria-hidden="true"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          color="var(--color-fg-brand)"
          name="chattingSend"
          size={24}
        />
      </div>
    </article>
  );
}

export function PostDetailSkeleton({ className, layout = 'modal', type }: PostDetailSkeletonProps) {
  const content =
    type === 'COMMUNITY' ? (
      <CommunityPostDetailSkeleton layout={layout} type={type} />
    ) : (
      <CompanionPostDetailSkeleton layout={layout} type={type} />
    );

  return <div className={cn(className)}>{content}</div>;
}
