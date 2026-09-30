'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueries } from '@tanstack/react-query';

import { chatRoomQueries } from './chat-room.queries';
import type {
  ChatRoomMessagesDirection,
  ChatRoomMessagesPageParam,
  ChatRoomMessagesResponse,
} from './chat-room.types';

type FetchDirection = ChatRoomMessagesDirection | null;

type PendingFetch = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

export function useChatRoomQueries(roomId: string) {
  const [detailQuery] = useQueries({
    queries: [chatRoomQueries.detail(roomId)],
  });
  const [requestedDirection, setRequestedDirection] = useState<FetchDirection>(null);
  const [fetchDirection, setFetchDirection] = useState<FetchDirection>(null);
  const [lastFetchDirection, setLastFetchDirection] = useState<FetchDirection>(null);
  const pendingFetchRef = useRef<PendingFetch | null>(null);
  const getNextPageParam = useCallback(
    (lastPage: ChatRoomMessagesResponse): ChatRoomMessagesPageParam => {
      if (!requestedDirection) {
        return undefined;
      }

      return {
        direction: requestedDirection,
        before: lastPage.data.before_cursor ?? undefined,
        after: lastPage.data.after_cursor ?? undefined,
      };
    },
    [requestedDirection],
  );
  const messagesQuery = useInfiniteQuery(chatRoomQueries.messages(roomId, getNextPageParam));
  const { fetchNextPage, isFetchNextPageError, isFetchingNextPage } = messagesQuery;

  const cursors = useMemo(() => {
    const lastPage = messagesQuery.data?.pages.at(-1);

    return {
      before: lastPage?.data.before_cursor,
      after: lastPage?.data.after_cursor,
    };
  }, [messagesQuery.data?.pages]);

  useEffect(() => {
    if (!requestedDirection || isFetchingNextPage || !pendingFetchRef.current) {
      return;
    }

    const pendingFetch = pendingFetchRef.current;

    void fetchNextPage()
      .then(() => pendingFetch.resolve())
      .catch((error: unknown) => pendingFetch.reject(error))
      .finally(() => {
        pendingFetchRef.current = null;
        setRequestedDirection(null);
        setFetchDirection(null);
      });
  }, [fetchNextPage, isFetchingNextPage, requestedDirection]);

  const fetchMessages = useCallback(
    (direction: ChatRoomMessagesDirection) => {
      const cursor = cursors[direction];

      if (!cursor || isFetchingNextPage || pendingFetchRef.current) {
        return Promise.resolve();
      }

      setFetchDirection(direction);
      setLastFetchDirection(direction);

      return new Promise<void>((resolve, reject) => {
        pendingFetchRef.current = { reject, resolve };
        setRequestedDirection(direction);
      });
    },
    [cursors, isFetchingNextPage],
  );

  const fetchPreviousMessages = useCallback(() => fetchMessages('before'), [fetchMessages]);
  const fetchNewerMessages = useCallback(() => fetchMessages('after'), [fetchMessages]);

  return {
    afterCursor: cursors.after,
    beforeCursor: cursors.before,
    detailQuery,
    fetchNewerMessages,
    fetchPreviousMessages,
    hasNewerMessages: cursors.after !== undefined && cursors.after !== null,
    hasPreviousMessages: cursors.before !== undefined && cursors.before !== null,
    isFetchNewerMessagesError: isFetchNextPageError && lastFetchDirection === 'after',
    isFetchPreviousMessagesError: isFetchNextPageError && lastFetchDirection === 'before',
    isFetchingNewerMessages: fetchDirection === 'after',
    isFetchingPreviousMessages: fetchDirection === 'before',
    messagesQuery,
  };
}
