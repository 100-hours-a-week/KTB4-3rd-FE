'use client';

import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useMatchingEntry } from '../model/use-matching-entry';
import { useMatchingMapState } from '../model/use-matching-map-state';
import { MatchingPageView } from './matching-page-view';
import { CarPoolList, type CarPoolListItem } from '@/entities/carpool';
import { getCarpoolPinMarkerImage } from '@/entities/map-pin';
import { useCurrentUserQuery } from '@/features/user-profile';
import { ApiError } from '@/shared/api/client';
import { carpoolQueries } from '@/shared/api/carpool';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { Map } from '@/shared/ui/map';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';
import { Text } from '@/shared/ui/text';
import { CarpoolDetailModal, type CarpoolSelection } from './carpool-detail-modal';

function setScrollTop(element: HTMLElement, scrollTop: number) {
  element.scrollTop = scrollTop;
}

export function MatchingPage() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUserQuery();
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const [selection, setSelection] = useState<CarpoolSelection | null>(null);
  const [isScrollRestoring, setIsScrollRestoring] = useState(false);
  const selectionRequestRef = useRef<(next: CarpoolSelection | null) => void>(() => undefined);
  const scrollSnapshotRef = useRef<{ queryKey: string; scrollTop: number } | null>(null);
  const pendingFocusIdRef = useRef<number | null>(null);
  const previousListQueryKeyRef = useRef<string | null>(null);
  const { fabContainerRef, isFabOpen, onCarpoolClick, onFabOpenChange, onTaxipotClick } =
    useMatchingEntry();
  const {
    distanceOrigin,
    isListReady,
    mapRef,
    mapViewport,
    onCurrentLocationClick,
    onUserLocationChange,
    onViewportChange,
  } = useMatchingMapState();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const queryViewport = useMemo(
    () =>
      mapViewport
        ? {
            sw_lat: mapViewport.southWest.lat,
            sw_lng: mapViewport.southWest.lng,
            ne_lat: mapViewport.northEast.lat,
            ne_lng: mapViewport.northEast.lng,
          }
        : null,
    [mapViewport],
  );
  const nearbyQueryOptions = useMemo(
    () =>
      carpoolQueries.nearby(
        queryViewport
          ? { ...queryViewport, lat: distanceOrigin.lat, lng: distanceOrigin.lng }
          : null,
      ),
    [distanceOrigin, queryViewport],
  );
  const nearbyQuery = useInfiniteQuery(nearbyQueryOptions);
  const pinsQuery = useQuery(carpoolQueries.pins(queryViewport));
  const refetchPins = pinsQuery.refetch;
  const carpools = useMemo<CarPoolListItem[]>(
    () => nearbyQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [nearbyQuery.data],
  );
  const pins = useMemo(() => pinsQuery.data?.data.items ?? [], [pinsQuery.data]);
  const listQueryKey = useMemo(
    () => JSON.stringify({ viewport: queryViewport, origin: distanceOrigin }),
    [distanceOrigin, queryViewport],
  );
  const markers = useMemo(
    () =>
      pins.map((pin) => ({
        id: pin.id,
        image: getCarpoolPinMarkerImage(),
        isSelected: selection?.id === pin.id,
        position: { lat: pin.lat, lng: pin.lng },
        title: `카풀 게시글 ${pin.id}`,
      })),
    [pins, selection?.id],
  );
  const {
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isError: isNearbyError,
    fetchStatus: nearbyFetchStatus,
    isFetching: isNearbyFetching,
    error: nearbyError,
    errorUpdatedAt: nearbyErrorUpdatedAt,
    data: nearbyData,
    refetch: refetchNearby,
  } = nearbyQuery;
  const handleLoadMore = useCallback(() => {
    if (selection !== null || !hasNextPage || isFetching) {
      return;
    }
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetching, selection]);

  const applySelection = useCallback(
    (nextSelection: CarpoolSelection | null) => {
      if (nextSelection && selection === null && scrollRoot) {
        scrollSnapshotRef.current = { queryKey: listQueryKey, scrollTop: scrollRoot.scrollTop };
      }
      if (nextSelection === null && selection !== null) {
        pendingFocusIdRef.current = selection.id;
      }
      setSelection(nextSelection);
    },
    [listQueryKey, scrollRoot, selection],
  );

  const requestSelection = useCallback((nextSelection: CarpoolSelection | null) => {
    selectionRequestRef.current(nextSelection);
  }, []);

  const handlePinClick = useCallback(
    (marker: { id: string | number }) => {
      const pin = pins.find((candidate) => candidate.id === Number(marker.id));
      requestSelection({
        id: Number(marker.id),
        position: pin ? { lat: pin.lat, lng: pin.lng } : null,
      });
    },
    [pins, requestSelection],
  );

  const handleListCarpoolClick = useCallback(
    (carpoolId: number) => {
      const pin = pins.find((candidate) => candidate.id === carpoolId);
      requestSelection({ id: carpoolId, position: pin ? { lat: pin.lat, lng: pin.lng } : null });
    },
    [pins, requestSelection],
  );

  useEffect(() => {
    if (previousListQueryKeyRef.current === null) {
      previousListQueryKeyRef.current = listQueryKey;
      return;
    }
    if (previousListQueryKeyRef.current === listQueryKey) {
      return;
    }
    previousListQueryKeyRef.current = listQueryKey;
    scrollSnapshotRef.current = null;
    if (scrollRoot) {
      setScrollTop(scrollRoot, 0);
    }
  }, [listQueryKey, scrollRoot]);

  useLayoutEffect(() => {
    if (selection !== null || !scrollRoot) {
      return;
    }
    const snapshot = scrollSnapshotRef.current;
    if (!snapshot) {
      return;
    }
    setIsScrollRestoring(true);
    const frame = requestAnimationFrame(() => {
      if (scrollSnapshotRef.current === snapshot && scrollRoot.isConnected) {
        setScrollTop(scrollRoot, snapshot.queryKey === listQueryKey ? snapshot.scrollTop : 0);
      }
      const pendingFocusId = pendingFocusIdRef.current;
      if (pendingFocusId !== null && scrollRoot.isConnected) {
        scrollRoot
          .querySelector<HTMLButtonElement>(`button[data-carpool-id="${pendingFocusId}"]`)
          ?.focus();
        pendingFocusIdRef.current = null;
      }
      scrollSnapshotRef.current = null;
      setIsScrollRestoring(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [listQueryKey, nearbyQuery.data, scrollRoot, selection]);

  const handledCursorErrorRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isFetchNextPageError || !nearbyError) {
      return;
    }
    if (nearbyError instanceof ApiError && nearbyError.code === 'INVALID_CURSOR') {
      if (handledCursorErrorRef.current === nearbyErrorUpdatedAt) {
        return;
      }
      handledCursorErrorRef.current = nearbyErrorUpdatedAt;
      void queryClient.resetQueries({ queryKey: nearbyQueryOptions.queryKey, exact: true });
      showSnackbar('카풀 목록을 처음부터 다시 불러오고 있어요.', 'critical');
      return;
    }
    showSnackbar('카풀 목록을 더 불러오지 못했어요. 다시 시도해주세요.', 'critical', {
      children: '다시 시도',
      onClick: () => {
        if (selection === null && !isFetching && hasNextPage) {
          void fetchNextPage();
        }
      },
    });
  }, [
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchNextPageError,
    nearbyError,
    nearbyErrorUpdatedAt,
    nearbyQueryOptions.queryKey,
    queryClient,
    selection,
    showSnackbar,
  ]);

  useEffect(() => {
    if (isNearbyError && carpools.length > 0) {
      showSnackbar('카풀 목록을 새로고침하지 못했어요.', 'critical');
    }
  }, [carpools.length, isNearbyError, showSnackbar]);

  useEffect(() => {
    if (pinsQuery.isError) {
      showSnackbar('지도 카풀 핀을 불러오지 못했어요.', 'critical', {
        children: '다시 시도',
        onClick: () => void refetchPins(),
      });
    } else if (pinsQuery.data?.data.limit_exceeded) {
      showSnackbar('표시 가능한 핀 수를 초과해 일부 카풀이 보이지 않을 수 있어요.', 'default');
    }
  }, [
    pinsQuery.data?.data.limit_exceeded,
    pinsQuery.errorUpdatedAt,
    pinsQuery.isError,
    refetchPins,
    showSnackbar,
  ]);

  let listContent;
  if (!isListReady) {
    listContent = (
      <div className="px-4 py-6 text-center">
        <Text color="fg.neutralSubtle" variant="t3Regular">
          지도를 준비하고 있어요.
        </Text>
      </div>
    );
  } else if (nearbyData === undefined && nearbyFetchStatus === 'paused') {
    listContent = (
      <div className="px-4 py-6 text-center" role="status">
        <Text color="fg.neutralSubtle" variant="t3Regular">
          인터넷 연결을 기다리고 있어요.
        </Text>
      </div>
    );
  } else if (nearbyData === undefined && isNearbyFetching) {
    listContent = <CarPoolList status="loading" />;
  } else if (nearbyData === undefined && isNearbyError) {
    listContent = <CarPoolList status="error" onRetry={() => void refetchNearby()} />;
  } else if (nearbyData !== undefined && carpools.length === 0) {
    listContent = <CarPoolList status="empty" />;
  } else if (nearbyData === undefined) {
    listContent = (
      <div className="px-4 py-6 text-center">
        <Text color="fg.neutralSubtle" variant="t3Regular">
          주변 카풀을 확인할 준비가 되었어요.
        </Text>
      </div>
    );
  } else {
    listContent = (
      <CarPoolList
        canLoadMore={
          selection === null &&
          hasNextPage &&
          !isFetching &&
          !isFetchNextPageError &&
          !isScrollRestoring
        }
        hasNextPage={hasNextPage}
        isLoadingMore={isFetchingNextPage}
        items={carpools}
        loadMoreError={isFetchNextPageError}
        onCarpoolClick={handleListCarpoolClick}
        onLoadMore={handleLoadMore}
        scrollRoot={scrollRoot}
        status="content"
      />
    );
  }

  return (
    <>
      <MatchingPageView
        fabContainerRef={fabContainerRef}
        isFabOpened={isFabOpen}
        map={
          <div
            aria-label="매칭 지도"
            className="h-full"
            data-list-ready={isListReady}
            role="region"
          >
            <Map
              center={selection?.position ?? undefined}
              className="h-full"
              markerFocusLevel={2}
              markerFocusOffset={{ y: 160 }}
              markers={markers}
              locateOnMount
              onMarkerClick={handlePinClick}
              onUserLocationChange={onUserLocationChange}
              onViewportChange={onViewportChange}
              ref={mapRef}
              showCurrentLocationButton={false}
              showZoomControls={false}
            />
          </div>
        }
        onCarpoolClick={onCarpoolClick}
        onCurrentLocationClick={onCurrentLocationClick}
        onFabOpenChange={onFabOpenChange}
        nearbyCarpools={listContent}
        isListOpen={selection === null}
        onScrollElementChange={setScrollRoot}
        scrollContentKey={listQueryKey}
        onTaxipotClick={onTaxipotClick}
        user={currentUserQuery.data?.data}
      />
      <CarpoolDetailModal
        onSelectionChange={applySelection}
        onSelectionRequest={(callback) => {
          selectionRequestRef.current = callback;
        }}
        selection={selection}
      />
      <SnackbarViewport className="fixed inset-x-0 bottom-4 z-[2147483647] mx-auto max-w-[393px] px-5" />
    </>
  );
}
