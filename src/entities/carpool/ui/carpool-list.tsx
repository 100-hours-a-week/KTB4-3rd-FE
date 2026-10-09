'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

import { Button } from '@/shared/ui/button';
import { NearbyListSkeleton } from '@/shared/ui/nearby-list-skeleton';
import { ResultSection } from '@/shared/ui/result-section';
import { Text } from '@/shared/ui/text';

import type { CarPoolListItem } from '../model/carpool';
import { CarpoolItem } from './carpool-item';

export type CarPoolListProps =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; errorMessage?: string; onRetry: () => void }
  | {
      status: 'content';
      items: CarPoolListItem[];
      hasNextPage: boolean;
      isLoadingMore: boolean;
      canLoadMore: boolean;
      scrollRoot: HTMLElement | null;
      onCarpoolClick: (carpoolId: number) => void;
      onLoadMore: () => void;
    };

type ContentProps = Extract<CarPoolListProps, { status: 'content' }>;

const subscribeToCapabilities = () => () => {};
const supportsIntersectionObserver = () => typeof IntersectionObserver !== 'undefined';
const serverObserverSnapshot = () => true;

function CarpoolListContent({
  items,
  hasNextPage,
  isLoadingMore,
  canLoadMore,
  scrollRoot,
  onCarpoolClick,
  onLoadMore,
}: ContentProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const supportsObserver = useSyncExternalStore(
    subscribeToCapabilities,
    supportsIntersectionObserver,
    serverObserverSnapshot,
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !supportsObserver ||
      !scrollRoot ||
      !sentinel ||
      !hasNextPage ||
      !canLoadMore ||
      isLoadingMore
    ) {
      return;
    }
    let active = true;
    let notified = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (active && !notified && entries.some((entry) => entry.isIntersecting)) {
          notified = true;
          onLoadMore();
        }
      },
      { root: scrollRoot, rootMargin: '0px 0px 160px 0px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [items, hasNextPage, canLoadMore, isLoadingMore, scrollRoot, onLoadMore, supportsObserver]);

  return (
    <div>
      <ul aria-label="주변 카풀" className="m-0 list-none p-0">
        {items.map((carpool, index) => (
          <CarpoolItem
            key={carpool.id}
            carpool={carpool}
            onClick={onCarpoolClick}
            showDivider={index < items.length - 1}
          />
        ))}
      </ul>
      <div aria-hidden="true" className="h-px" ref={sentinelRef} />
      {isLoadingMore ? (
        <div className="py-4 text-center" role="status">
          <Text color="fg.neutralSubtle" variant="t3Regular">
            카풀을 더 불러오는 중
          </Text>
        </div>
      ) : null}
      {!supportsObserver && hasNextPage ? (
        <div className="px-4 py-3">
          <Button
            disabled={!canLoadMore || isLoadingMore}
            onClick={onLoadMore}
            size="medium"
            variant="neutral-weak"
            width="fill"
          >
            다음 페이지 불러오기
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function CarPoolList(props: CarPoolListProps) {
  switch (props.status) {
    case 'loading':
      return <NearbyListSkeleton label="주변 카풀을 불러오는 중" />;
    case 'empty':
      return (
        <ResultSection
          title="주변에 카풀이 없어요"
          description="지도를 움직여 다른 지역을 확인해보세요."
          size="medium"
          iconName="info"
        />
      );
    case 'error':
      return (
        <ResultSection
          title="카풀을 불러오지 못했어요"
          description={props.errorMessage ?? '잠시 후 다시 시도해주세요.'}
          size="medium"
          iconName="info"
          buttons="primary"
          primaryLabel="다시 불러오기"
          primaryButtonProps={{ onClick: props.onRetry }}
        />
      );
    case 'content':
      return <CarpoolListContent {...props} />;
  }
}
