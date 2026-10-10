'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { carpoolRequestQueryKeys } from '@/entities/carpool-request';
import {
  CarpoolRequestModal,
  useCarpoolRequestDetailQuery,
} from '@/features/carpool-request-review';
import { useCarpoolRequestListQuery } from '@/_pages/chat-list/api/carpool-requests';
import {
  CarpoolRequestListContent,
  type CarpoolRequestListState,
} from './carpool-request-list-content';

type SelectedRequest = { carpoolId: number; requestId: number; viewerId: number };

export function CarpoolRequestQueryContent({
  direction,
  isAuthenticated,
  viewerId,
  onChatClick,
}: {
  direction: 'SENT' | 'RECEIVED';
  isAuthenticated: boolean;
  viewerId: number | null;
  onChatClick: (chatRoomId: number) => void;
}) {
  const query = useCarpoolRequestListQuery({ direction, enabled: isAuthenticated, viewerId });
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<SelectedRequest | null>(null);
  const detailQuery = useCarpoolRequestDetailQuery({
    viewerId: selected?.viewerId ?? viewerId,
    carpoolId: selected?.carpoolId ?? null,
    requestId: selected?.requestId ?? null,
    enabled: selected !== null && selected.viewerId === viewerId && isAuthenticated,
  });

  const closeModal = useCallback(() => setSelected(null), []);
  const onRequestClick = useCallback(
    (carpoolId: number, requestId: number) => {
      if (direction !== 'RECEIVED' || !query.data || viewerId === null) {
        return;
      }
      const preview = query.data.pages
        .flatMap((page) => page.data.items)
        .find((item) => item.carpool_id === carpoolId && item.id === requestId);
      if (!preview) {
        return;
      }

      queryClient.setQueryData(carpoolRequestQueryKeys.detail(viewerId, carpoolId, requestId), {
        message: '목록에 있는 요청 정보를 표시합니다.',
        data: {
          id: preview.id,
          carpool_id: preview.carpool_id,
          status: preview.status,
          requester: preview.counterpart,
          content: preview.content,
          created_at: preview.created_at,
        },
      });
      setSelected({ carpoolId, requestId, viewerId });
    },
    [direction, query.data, queryClient, viewerId],
  );

  let state: CarpoolRequestListState;
  if (!isAuthenticated || viewerId === null || (query.isPending && !query.data)) {
    state = { status: 'loading' };
  } else if (query.data === undefined) {
    state = { status: 'error', onRetry: () => void query.refetch() };
  } else {
    const items = query.data.pages.flatMap((page) => page.data.items);
    state = items.length
      ? {
          status: 'content',
          items,
          hasNextPage: query.hasNextPage,
          isLoadingMore: query.isFetchingNextPage,
          hasLoadMoreError: query.isFetchNextPageError,
          onLoadMore: () => void query.fetchNextPage(),
          onRetryLoadMore: () => void query.fetchNextPage(),
        }
      : { status: 'empty' };
  }

  let modal = null;
  if (selected && selected.viewerId === viewerId && isAuthenticated) {
    const detail = detailQuery.data?.data;
    if (detail) {
      modal = (
        <CarpoolRequestModal
          canAccept={false}
          canReject={false}
          onAccept={() => undefined}
          onClose={closeModal}
          onReject={() => undefined}
          open
          processingAction={null}
          request={detail}
          status="content"
        />
      );
    } else if (detailQuery.isPending) {
      modal = <CarpoolRequestModal onClose={closeModal} open status="loading" />;
    } else {
      modal = (
        <CarpoolRequestModal
          errorMessage="요청 정보를 불러오지 못했어요. 다시 시도해주세요."
          onClose={closeModal}
          onRetry={() => void detailQuery.refetch()}
          open
          status="error"
        />
      );
    }
  }

  return (
    <>
      <CarpoolRequestListContent
        direction={direction}
        onChatClick={onChatClick}
        onRequestClick={onRequestClick}
        state={state}
      />
      {modal}
    </>
  );
}
