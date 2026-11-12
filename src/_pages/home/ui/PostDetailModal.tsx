'use client';

import { PostDetailSkeleton, type PostDetail } from '@/entities/post';
import {
  CompanionPostDetail as CompanionPostDetailView,
  CommunityPostDetail as CommunityPostDetailView,
  type CompanionPostDetailProps,
  type CommunityPostDetailProps,
} from '@/features/post-detail';
import { BottomModal } from '@/shared/ui/bottom-modal';
import { Icon } from '@/shared/ui/icon';
import { ResultSection } from '@/shared/ui/result-section';

import type { SelectedPost } from '@/_pages/home/model/home-types';

type PostDetailModalProps = {
  commentProps: Omit<CommunityPostDetailProps, 'post'>;
  companionProps: Omit<CompanionPostDetailProps, 'post'>;
  detailError: boolean;
  detailLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  post: SelectedPost | null;
  postDetail: PostDetail | null;
  postNotFound: boolean;
};

const POST_ERROR_TITLE = '게시글을 불러올 수 없어요';
const POST_ERROR_DESCRIPTION =
  '게시글을 불러오는 중 오류가 발생했어요.\n잠시 후 다시 시도해주세요.';

const postErrorIcon = (
  <Icon
    aria-hidden="true"
    color="var(--color-fg-critical)"
    name="exclamationmarkCircleFill"
    size={66}
  />
);

export function PostDetailModal({
  commentProps,
  companionProps,
  detailError,
  detailLoading,
  onOpenChange,
  onRetry,
  post,
  postDetail,
  postNotFound,
}: PostDetailModalProps) {
  if (!post || postNotFound) {
    return null;
  }

  return (
    <BottomModal
      bottomOffset="calc(72px + env(safe-area-inset-bottom, 0px) + 8px)"
      href={`/posts/${post.id}?type=${post.type === 'COMPANION' ? 'companion' : 'community'}`}
      open
      onOpenChange={onOpenChange}
    >
      {post.type === 'COMPANION' && detailLoading ? <PostDetailSkeleton type="COMPANION" /> : null}
      {post.type === 'COMMUNITY' && detailLoading ? <PostDetailSkeleton type="COMMUNITY" /> : null}
      {detailError ? (
        <ResultSection
          buttons="primary"
          description={POST_ERROR_DESCRIPTION}
          icon={postErrorIcon}
          primaryButtonProps={{ onClick: onRetry }}
          primaryLabel="다시 불러오기"
          size="medium"
          title={POST_ERROR_TITLE}
        />
      ) : null}
      {postDetail?.type === 'COMPANION' ? (
        <CompanionPostDetailView {...companionProps} post={postDetail} />
      ) : null}
      {postDetail?.type === 'COMMUNITY' ? (
        <CommunityPostDetailView {...commentProps} post={postDetail} />
      ) : null}
    </BottomModal>
  );
}
