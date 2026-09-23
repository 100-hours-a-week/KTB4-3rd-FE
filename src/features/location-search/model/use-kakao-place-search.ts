'use client';

import { useEffect, useRef, useState } from 'react';

import { searchKakaoPlaces } from './kakao-place-search';
import type { LocationSearchResult } from './location';

export type KakaoPlaceSearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export type UseKakaoPlaceSearchOptions = {
  debounceMs?: number;
  enabled?: boolean;
};

export type UseKakaoPlaceSearchResult = {
  error: Error | null;
  results: LocationSearchResult[];
  status: KakaoPlaceSearchStatus;
};

type SearchState = UseKakaoPlaceSearchResult & {
  query: string;
};

export function useKakaoPlaceSearch(
  query: string,
  { debounceMs = 300, enabled = true }: UseKakaoPlaceSearchOptions = {},
): UseKakaoPlaceSearchResult {
  const requestId = useRef(0);
  const [state, setState] = useState<SearchState>({
    error: null,
    query: '',
    results: [],
    status: 'idle',
  });

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (!enabled || !normalizedQuery) {
      requestId.current += 1;
      return;
    }

    const currentRequestId = ++requestId.current;
    const timeoutId = window.setTimeout(() => {
      setState({ error: null, query: normalizedQuery, results: [], status: 'loading' });

      searchKakaoPlaces(normalizedQuery).then(
        (results) => {
          if (currentRequestId !== requestId.current) {
            return;
          }

          setState({
            error: null,
            query: normalizedQuery,
            results,
            status: results.length > 0 ? 'success' : 'empty',
          });
        },
        (error: unknown) => {
          if (currentRequestId !== requestId.current) {
            return;
          }

          setState({
            error: error instanceof Error ? error : new Error('장소 검색에 실패했습니다.'),
            query: normalizedQuery,
            results: [],
            status: 'error',
          });
        },
      );
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, enabled, query]);

  const normalizedQuery = query.trim();

  if (!enabled || !normalizedQuery) {
    return { error: null, results: [], status: 'idle' };
  }

  if (state.query !== normalizedQuery) {
    return { error: null, results: [], status: 'loading' };
  }

  return {
    error: state.error,
    results: state.results,
    status: state.status,
  };
}
