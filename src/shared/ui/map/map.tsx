'use client';

import { Minus, Plus } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
} from 'react';

import type { MapCoordinate } from '@/shared/types/common';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

import { loadKakaoMaps } from './model/map-loader';
import {
  DEFAULT_MAP_CENTER,
  getMapLocationError,
  toMapCoordinate,
  toMapViewport,
} from './model/map.utils';
import type {
  KakaoMap,
  KakaoMarker,
  KakaoMarkerClusterer,
  KakaoMapsApi,
  KakaoNamespace,
} from './model/kakao-map.types';
import type { MapLoadError, MapLocationError, MapMarker, MapViewport } from './model/map.types';

const DEFAULT_LEVEL = 5;
const DEFAULT_VIEWPORT_DEBOUNCE_MS = 300;

type MapStatus = 'loading' | 'ready' | 'error';

export type MapProps = {
  apiKey?: string;
  center?: MapCoordinate;
  className?: string;
  clusterMarkers?: boolean;
  clusterMinLevel?: number;
  defaultCenter?: MapCoordinate;
  defaultLevel?: number;
  locateOnMount?: boolean;
  markers?: readonly MapMarker[];
  onLoadError?: (error: MapLoadError) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  onUserLocationChange?: (coordinate: MapCoordinate) => void;
  onUserLocationError?: (error: MapLocationError) => void;
  onViewportChange?: (viewport: MapViewport) => void;
  onCenterChange?: (center: MapCoordinate) => void;
  selectionMode?: boolean;
  showCurrentLocationButton?: boolean;
  showZoomControls?: boolean;
  userLocation?: MapCoordinate | null;
  viewportDebounceMs?: number;
};

type MapControlButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

function MapControlButton({ label, className, children, ...props }: MapControlButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        'flex size-11 items-center justify-center rounded-full border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-layer-default)] text-[var(--color-fg-neutral)] shadow-[0_2px_8px_rgb(0_0_0_/_12%)] transition-colors hover:bg-[var(--color-bg-neutral-weak)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)] active:bg-[var(--color-bg-neutral-weak-pressed)] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function createMarkerImage(maps: KakaoMapsApi, kind: 'post' | 'user') {
  const isUserMarker = kind === 'user';
  const width = isUserMarker ? 24 : 40;
  const height = isUserMarker ? 24 : 48;
  const color = isUserMarker ? '#3b82f6' : '#f04452';
  const svg = isUserMarker
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="4"/><circle cx="12" cy="12" r="2.5" fill="white"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><path d="M20 2C10.06 2 2 10.06 2 20c0 12.68 18 26 18 26s18-13.32 18-26C38 10.06 29.94 2 20 2Z" fill="${color}" stroke="white" stroke-width="3"/><circle cx="20" cy="20" r="6" fill="white"/></svg>`;
  const imageUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

  return new maps.MarkerImage(imageUrl, new maps.Size(width, height), {
    offset: new maps.Point(width / 2, height),
  });
}

function isSameCoordinate(left: MapCoordinate, right: MapCoordinate) {
  return left.lat === right.lat && left.lng === right.lng;
}

export function Map({
  apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY,
  center,
  className,
  clusterMarkers = true,
  clusterMinLevel = 6,
  defaultCenter = DEFAULT_MAP_CENTER,
  defaultLevel = DEFAULT_LEVEL,
  locateOnMount = false,
  markers = [],
  onLoadError,
  onMarkerClick,
  onUserLocationChange,
  onUserLocationError,
  onViewportChange,
  onCenterChange,
  selectionMode = false,
  showCurrentLocationButton = true,
  showZoomControls = true,
  userLocation,
  viewportDebounceMs = DEFAULT_VIEWPORT_DEBOUNCE_MS,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const kakaoRef = useRef<KakaoNamespace | null>(null);
  const clustererRef = useRef<KakaoMarkerClusterer | null>(null);
  const viewportTimerRef = useRef<number | null>(null);
  const pendingLocationRef = useRef<MapCoordinate | null>(null);
  const initialCenterRef = useRef(center ?? defaultCenter);
  const [status, setStatus] = useState<MapStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<MapCoordinate | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const markerLocation = userLocation ?? currentLocation;
  const hasUserLocation = markerLocation !== null;
  const markerList = useMemo(() => [...markers], [markers]);

  const onLoadErrorRef = useRef(onLoadError);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onUserLocationChangeRef = useRef(onUserLocationChange);
  const onUserLocationErrorRef = useRef(onUserLocationError);
  const onViewportChangeRef = useRef(onViewportChange);
  const onCenterChangeRef = useRef(onCenterChange);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
    onMarkerClickRef.current = onMarkerClick;
    onUserLocationChangeRef.current = onUserLocationChange;
    onUserLocationErrorRef.current = onUserLocationError;
    onViewportChangeRef.current = onViewportChange;
    onCenterChangeRef.current = onCenterChange;
  }, [
    onLoadError,
    onMarkerClick,
    onUserLocationChange,
    onUserLocationError,
    onViewportChange,
    onCenterChange,
  ]);

  const emitMapState = useCallback(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const mapCenter = toMapCoordinate(map.getCenter());
    const viewport = toMapViewport(map.getBounds());

    onViewportChangeRef.current?.(viewport);
    onCenterChangeRef.current?.(mapCenter);
  }, []);

  const scheduleMapState = useCallback(() => {
    if (viewportTimerRef.current !== null) {
      window.clearTimeout(viewportTimerRef.current);
    }

    viewportTimerRef.current = window.setTimeout(() => {
      viewportTimerRef.current = null;
      emitMapState();
    }, viewportDebounceMs);
  }, [emitMapState, viewportDebounceMs]);

  useEffect(() => {
    let cancelled = false;
    let idleHandler: (() => void) | null = null;

    loadKakaoMaps(apiKey ?? '')
      .then((kakao) => {
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        const maps = kakao.maps;
        const map = new maps.Map(mapContainerRef.current, {
          center: new maps.LatLng(initialCenterRef.current.lat, initialCenterRef.current.lng),
          level: defaultLevel,
        });

        mapRef.current = map;
        kakaoRef.current = kakao;
        idleHandler = scheduleMapState;
        maps.event.addListener(map, 'idle', idleHandler);
        setStatus('ready');

        if (pendingLocationRef.current) {
          map.panTo(
            new maps.LatLng(pendingLocationRef.current.lat, pendingLocationRef.current.lng),
          );
          pendingLocationRef.current = null;
        }

        window.setTimeout(emitMapState, 0);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : '지도를 불러오지 못했습니다.';

        setStatus('error');
        setErrorMessage(message);
        onLoadErrorRef.current?.({ message });
      });

    return () => {
      cancelled = true;

      if (viewportTimerRef.current !== null) {
        window.clearTimeout(viewportTimerRef.current);
        viewportTimerRef.current = null;
      }

      if (idleHandler && mapRef.current && kakaoRef.current) {
        kakaoRef.current.maps.event.removeListener(mapRef.current, 'idle', idleHandler);
      }

      clustererRef.current?.setMap(null);
      clustererRef.current = null;
      mapRef.current = null;
      kakaoRef.current = null;
    };
  }, [apiKey, defaultLevel, emitMapState, scheduleMapState]);

  useEffect(() => {
    const map = mapRef.current;
    const kakao = kakaoRef.current;

    if (status !== 'ready' || !map || !kakao) {
      return;
    }

    if (center && !isSameCoordinate(center, toMapCoordinate(map.getCenter()))) {
      map.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
    }
  }, [center, status]);

  useEffect(() => {
    const map = mapRef.current;
    const kakao = kakaoRef.current;

    if (status !== 'ready' || !map || !kakao) {
      return;
    }

    const markerInstances: KakaoMarker[] = [];
    const markerImage = createMarkerImage(kakao.maps, 'post');

    markerList.forEach((markerData) => {
      const position = new kakao.maps.LatLng(markerData.position.lat, markerData.position.lng);
      const marker = new kakao.maps.Marker({
        image: markerImage,
        position,
        title: markerData.title,
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        map.panTo(position);
        onMarkerClickRef.current?.(markerData);
      });
      markerInstances.push(marker);
    });

    if (clusterMarkers && markerInstances.length > 0) {
      const clusterer = new kakao.maps.MarkerClusterer({
        averageCenter: true,
        disableClickZoom: true,
        map,
        minLevel: clusterMinLevel,
      });

      kakao.maps.event.addListener(clusterer, 'clusterclick', (cluster) => {
        const nextLevel = Math.max(map.getLevel() - 1, 1);

        map.setLevel(nextLevel, {
          anchor: cluster.getCenter(),
          animate: true,
        });
      });
      clusterer.addMarkers(markerInstances);
      clustererRef.current = clusterer;
    } else {
      markerInstances.forEach((marker) => marker.setMap(map));
    }

    return () => {
      markerInstances.forEach((marker) => marker.setMap(null));
      clustererRef.current?.clear();
      clustererRef.current?.setMap(null);
      clustererRef.current = null;
    };
  }, [clusterMarkers, clusterMinLevel, markerList, status]);

  useEffect(() => {
    const map = mapRef.current;
    const kakao = kakaoRef.current;

    if (status !== 'ready' || !map || !kakao || !hasUserLocation || !markerLocation) {
      return;
    }

    const marker = new kakao.maps.Marker({
      image: createMarkerImage(kakao.maps, 'user'),
      position: new kakao.maps.LatLng(markerLocation.lat, markerLocation.lng),
      title: '현재 위치',
    });

    marker.setMap(map);

    return () => marker.setMap(null);
  }, [hasUserLocation, markerLocation, status]);

  useEffect(() => {
    const map = mapRef.current;

    if (
      status !== 'ready' ||
      !map ||
      typeof ResizeObserver === 'undefined' ||
      !mapContainerRef.current
    ) {
      return;
    }

    const observer = new ResizeObserver(() => map.relayout());

    observer.observe(mapContainerRef.current);

    return () => observer.disconnect();
  }, [status]);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const delta = direction === 'in' ? -1 : 1;

    map.setLevel(Math.min(Math.max(map.getLevel() + delta, 1), 14), { animate: true });
  }, []);

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const error: MapLocationError = {
        code: 'unsupported',
        message: '이 브라우저에서는 현재 위치를 사용할 수 없습니다.',
      };

      onUserLocationErrorRef.current?.(error);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordinate = {
          lat: coords.latitude,
          lng: coords.longitude,
        };

        setCurrentLocation(coordinate);
        onUserLocationChangeRef.current?.(coordinate);

        const map = mapRef.current;
        const kakao = kakaoRef.current;

        if (map && kakao) {
          map.panTo(new kakao.maps.LatLng(coordinate.lat, coordinate.lng));
        } else {
          pendingLocationRef.current = coordinate;
        }

        setIsLocating(false);
      },
      (positionError) => {
        setIsLocating(false);
        onUserLocationErrorRef.current?.(getMapLocationError(positionError));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 10_000,
      },
    );
  }, []);

  useEffect(() => {
    if (!locateOnMount) {
      return;
    }

    const timer = window.setTimeout(handleCurrentLocation, 0);

    return () => window.clearTimeout(timer);
  }, [handleCurrentLocation, locateOnMount]);

  return (
    <div
      className={cn('relative min-h-[320px] w-full overflow-hidden bg-[#e9eef2]', className)}
      data-testid="map"
    >
      <div
        aria-label="지도"
        className="absolute inset-0"
        data-testid="map-container"
        ref={mapContainerRef}
        role="application"
      />

      {selectionMode && status === 'ready' ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full"
          data-testid="map-selection-marker"
        >
          <span className="block size-10 rounded-full border-[3px] border-white bg-[var(--color-bg-brand-solid)] shadow-[0_3px_8px_rgb(0_0_0_/_24%)]" />
          <span className="absolute bottom-[-5px] left-1/2 size-3 -translate-x-1/2 rotate-45 bg-[var(--color-bg-brand-solid)]" />
        </div>
      ) : null}

      {status === 'loading' ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[#e9eef2]/80"
          role="status"
        >
          <span className="rounded-full bg-white/90 px-4 py-2 text-sm text-slate-700 shadow-sm">
            지도를 불러오는 중…
          </span>
        </div>
      ) : null}

      {status === 'error' ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[#e9eef2] p-6 text-center"
          role="alert"
        >
          <div className="max-w-sm rounded-2xl bg-white/95 px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">지도를 불러오지 못했어요.</p>
            <p className="mt-1 text-xs text-slate-600">
              {errorMessage ?? '지도 설정을 확인한 뒤 다시 시도해 주세요.'}
            </p>
          </div>
        </div>
      ) : null}

      {status === 'ready' && showZoomControls ? (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <MapControlButton label="지도 확대" onClick={() => handleZoom('in')}>
            <Plus aria-hidden="true" size={20} strokeWidth={2} />
          </MapControlButton>
          <MapControlButton label="지도 축소" onClick={() => handleZoom('out')}>
            <Minus aria-hidden="true" size={20} strokeWidth={2} />
          </MapControlButton>
        </div>
      ) : null}

      {status === 'ready' && showCurrentLocationButton ? (
        <MapControlButton
          className="absolute right-4 bottom-4 z-20"
          disabled={isLocating}
          label="현재 위치로 이동"
          onClick={handleCurrentLocation}
        >
          <Icon name="crosshair" size={22} />
        </MapControlButton>
      ) : null}
    </div>
  );
}
