import type { MouseEventHandler } from 'react';

import {
  MovementDetailInfo,
  ParticipantList,
  PostDetailInfo,
  TransportTag,
  type CompanionPostDetail,
} from '@/entities/post';
import { JoinCompanionButton } from '@/features/join-companion';
import { cn } from '@/shared/lib/cn';
import { Divider } from '@/shared/ui/divider';
import { Snackbar } from '@/shared/ui/snackbar';

export type CompanionPostDetailProps = {
  className?: string;
  layout?: 'modal' | 'page';
  isJoining?: boolean;
  joinErrorMessage?: string | null;
  onJoinClick?: MouseEventHandler<HTMLButtonElement>;
  onJoinErrorDismiss?: () => void;
  post: CompanionPostDetail;
};

export function CompanionPostDetail({
  className,
  layout = 'modal',
  isJoining = false,
  joinErrorMessage,
  onJoinClick,
  onJoinErrorDismiss,
  post,
}: CompanionPostDetailProps) {
  const isPageLayout = layout === 'page';

  return (
    <article className={cn(isPageLayout && 'min-h-[calc(100dvh-56px)] pb-[112px]', className)}>
      <PostDetailInfo
        description={post.description}
        layout={layout}
        title={post.title}
        type={post.type}
      />

      <div className={isPageLayout ? 'px-6 pt-[26px]' : 'px-6 pb-5'}>
        <TransportTag
          className={isPageLayout ? '!py-[3px]' : undefined}
          transport={post.transport_type}
        />
      </div>

      <Divider
        className={isPageLayout ? 'mt-[37px]' : 'mb-5'}
        color={isPageLayout ? 'var(--color-stroke-neutral-weak)' : 'neutral-subtle'}
        inset
      />
      <MovementDetailInfo
        capacity={post.capacity}
        current_count={post.current_count}
        departure_at={post.departure_at}
        departure_location={post.departure_location}
        destination={post.destination}
        layout={layout}
      />
      <Divider
        className={isPageLayout ? 'mt-4' : 'my-5'}
        color={isPageLayout ? 'var(--color-stroke-neutral-weak)' : 'neutral-subtle'}
        inset
      />
      <ParticipantList
        className={isPageLayout ? 'pb-0' : 'pb-6'}
        layout={layout}
        participants={post.participants}
      />
      <div
        className={cn(
          'px-6 pb-6',
          isPageLayout &&
            'fixed bottom-[calc(32px+env(safe-area-inset-bottom,0px))] left-1/2 z-20 w-[calc(100%-40px)] max-w-[353px] -translate-x-1/2 px-0 pb-0',
        )}
      >
        {joinErrorMessage ? (
          <Snackbar
            className="mb-2 !w-full !max-w-none"
            description={joinErrorMessage}
            onOpenChange={(open) => {
              if (!open) {
                onJoinErrorDismiss?.();
              }
            }}
            open
            type="critical"
          />
        ) : null}
        <JoinCompanionButton
          className={isPageLayout ? '!h-[52px] !min-h-[52px] !rounded-[8px]' : undefined}
          loading={isJoining}
          onClick={onJoinClick}
        />
      </div>
    </article>
  );
}
