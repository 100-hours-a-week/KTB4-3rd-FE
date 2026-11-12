'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { PostList, type Post } from '@/entities/post';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Icon } from '@/shared/ui/icon';
import { ResultSection } from '@/shared/ui/result-section';
import { Text } from '@/shared/ui/text';

import { HomeNearbyPostsSkeleton } from './home-page-loading';

type NearbyPostsSheetProps = {
  hasNextPage?: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  open: boolean;
  onCreatePost: () => void;
  onLoadMore: () => void;
  onPostClick: (post: Post) => void;
  onRetry: () => void;
  posts: readonly Post[];
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
const emptyPostsIcon = (
  <Image
    alt=""
    aria-hidden="true"
    height={66}
    src="/icons/seed/icon_document_tray_line.svg"
    width={66}
  />
);

export function NearbyPostsSheet({
  hasNextPage = false,
  isError,
  isFetchingNextPage,
  isLoading,
  onCreatePost,
  onLoadMore,
  onPostClick,
  onRetry,
  open,
  posts,
}: NearbyPostsSheetProps) {
  const loadMorePostsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = loadMorePostsRef.current;

    if (!target || !hasNextPage || isError || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { rootMargin: '0px 0px 160px 0px' },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasNextPage, isError, isFetchingNextPage, onLoadMore]);

  return (
    <BottomSheet
      bottomOffset="calc(72px + env(safe-area-inset-bottom, 0px))"
      className="mx-auto w-full max-w-[393px]"
      defaultSnapPoint="110px"
      modal={false}
      open={open}
      showBackdrop={false}
      showScrollFog
      scrollContentKey={posts.length}
      snapPoints={['110px', 0.5, 0.7]}
      title="근처 핀 게시글"
      description="가까운 순"
    >
      {isLoading ? <HomeNearbyPostsSkeleton /> : null}
      {isError && posts.length === 0 ? (
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
      {!isLoading && !isError && posts.length === 0 ? (
        <ResultSection
          buttons="primary"
          description="가장 먼저 글을 등록하고 동행자를 찾아보세요"
          icon={emptyPostsIcon}
          primaryButtonProps={{ onClick: onCreatePost }}
          primaryLabel="글 등록하기"
          size="medium"
          title="등록된 게시글이 없어요"
        />
      ) : null}
      {!isLoading && posts.length > 0 ? (
        <PostList
          className="pb-[calc(72px+env(safe-area-inset-bottom,0px))]"
          items={posts}
          onItemClick={onPostClick}
        />
      ) : null}
      {hasNextPage && posts.length > 0 ? (
        <div
          aria-busy={isFetchingNextPage}
          aria-live="polite"
          className="flex min-h-8 items-center justify-center py-2"
          data-testid="home-post-list-load-more"
          ref={loadMorePostsRef}
        >
          {isFetchingNextPage ? (
            <Text color="fg.neutralSubtle" variant="t4Regular">
              게시글을 불러오는 중이에요.
            </Text>
          ) : null}
        </div>
      ) : null}
    </BottomSheet>
  );
}
