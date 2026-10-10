'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useMatchingEntry } from '../model/use-matching-entry';
import { useMatchingMapState } from '../model/use-matching-map-state';
import { MatchingPageView } from './matching-page-view';
import { CarPoolList, type CarPoolListItem } from '@/entities/carpool';
import { getCarpoolPinMarkerImage } from '@/entities/map-pin';
import { useCurrentUserQuery } from '@/features/user-profile';
import { carpoolQueries } from '@/shared/api/carpool';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { Map } from '@/shared/ui/map';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';
import { CarpoolDetailModal, type CarpoolSelection } from './carpool-detail-modal';

function setScrollTop(element: HTMLElement, scrollTop: number) {
  element.scrollTop = scrollTop;
}

export function MatchingPage() {
  const currentUserQuery = useCurrentUserQuery();
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const [selection, setSelection] = useState<CarpoolSelection | null>(null);
  const [isScrollRestoring, setIsScrollRestoring] = useState(false);
  const selectionRequestRef = useRef<(next: CarpoolSelection | null) => void>(() => undefined);
  const scrollSnapshotRef = useRef<{ queryKey: string; scrollTop: number } | null>(null);
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
  const nearbyQuery = useInfiniteQuery(
    carpoolQueries.nearby(
      queryViewport ? { ...queryViewport, lat: distanceOrigin.lat, lng: distanceOrigin.lng } : null,
    ),
  );
  const pinsQuery = useQuery(carpoolQueries.pins(queryViewport));
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
        position: { lat: pin.lat, lng: pin.lng },
        title: `카풀 게시글 ${pin.id}`,
      })),
    [pins],
  );
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isError: isNearbyError,
    isPending: isNearbyPending,
    refetch: refetchNearby,
  } = nearbyQuery;
  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const applySelection = useCallback(
    (nextSelection: CarpoolSelection | null) => {
      if (nextSelection && selection === null && scrollRoot) {
        scrollSnapshotRef.current = { queryKey: listQueryKey, scrollTop: scrollRoot.scrollTop };
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
      scrollSnapshotRef.current = null;
      setIsScrollRestoring(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [listQueryKey, nearbyQuery.data, scrollRoot, selection]);

  useEffect(() => {
    if (isFetchNextPageError) {
      showSnackbar('카풀 목록을 더 불러오지 못했어요. 다시 시도해주세요.', 'critical');
    }
  }, [isFetchNextPageError, showSnackbar]);

  useEffect(() => {
    if (isNearbyError && carpools.length > 0) {
      showSnackbar('카풀 목록을 새로고침하지 못했어요.', 'critical');
    }
  }, [carpools.length, isNearbyError, showSnackbar]);

  useEffect(() => {
    if (pinsQuery.isError) {
      showSnackbar('지도 카풀 핀을 불러오지 못했어요.', 'critical');
    } else if (pinsQuery.data?.data.limit_exceeded) {
      showSnackbar('표시 가능한 핀 수를 초과해 일부 카풀이 보이지 않을 수 있어요.', 'default');
    }
  }, [pinsQuery.data?.data.limit_exceeded, pinsQuery.isError, showSnackbar]);

  let listContent;
  if (!isListReady || isNearbyPending) {
    listContent = <CarPoolList status="loading" />;
  } else if (isNearbyError && carpools.length === 0) {
    listContent = <CarPoolList status="error" onRetry={() => void refetchNearby()} />;
  } else if (carpools.length === 0) {
    listContent = <CarPoolList status="empty" />;
  } else {
    listContent = (
      <CarPoolList
        canLoadMore={!isFetchingNextPage && !isFetchNextPageError && !isScrollRestoring}
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
              centerChangeSource="selection"
              className="h-full"
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
