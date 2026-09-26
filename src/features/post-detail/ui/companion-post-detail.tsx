import type { MouseEventHandler } from 'react';

import {
  MovementDetailInfo,
  ParticipantList,
  PostDetailInfo,
  TransportTag,
  type CompanionPostDetail,
} from '@/entities/post';
import { JoinCompanionButton } from '@/features/join-companion';
import { Divider } from '@/shared/ui/divider';
import { Snackbar } from '@/shared/ui/snackbar';

export type CompanionPostDetailProps = {
  className?: string;
  isJoining?: boolean;
  joinErrorMessage?: string | null;
  onJoinClick?: MouseEventHandler<HTMLButtonElement>;
  onJoinErrorDismiss?: () => void;
  post: CompanionPostDetail;
};

export function CompanionPostDetail({
  className,
  isJoining = false,
  joinErrorMessage,
  onJoinClick,
  onJoinErrorDismiss,
  post,
}: CompanionPostDetailProps) {
  return (
    <article className={className}>
      <PostDetailInfo description={post.description} title={post.title} type={post.type} />

      <div className="px-6 pb-5">
        <TransportTag transport={post.transport_type} />
      </div>

      <Divider className="mb-5" color="neutral-subtle" inset />
      <MovementDetailInfo
        capacity={post.capacity}
        current_count={post.current_count}
        departure_at={post.departure_at}
        departure_location={post.departure_location}
        destination={post.destination}
      />
      <Divider className="my-5" color="neutral-subtle" inset />
      <ParticipantList className="pb-6" participants={post.participants} />
      <div className="px-6 pb-6">
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
        <JoinCompanionButton loading={isJoining} onClick={onJoinClick} />
      </div>
    </article>
  );
}
