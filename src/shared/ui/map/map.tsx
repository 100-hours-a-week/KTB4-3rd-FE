'use client';

import { Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ForwardedRef,
  forwardRef,
  type ReactNode,
} from 'react';

import { useLocationStore } from '@/shared/model/stores/location-store';
import type { MapCoordinate } from '@/shared/types/common';
import { cn } from '@/shared/lib/cn';
import { Dialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';

import { loadKakaoMaps } from './model/map-loader';
import {
  DEFAULT_MAP_CENTER,
  getMapLocationError,
  toMapCoordinate,
  toMapViewport,
} from './model/map.utils';
import type {
  KakaoLatLng,
  KakaoMap,
  KakaoMarker,
  KakaoMarkerClusterer,
  KakaoMapsApi,
  KakaoNamespace,
  KakaoPoint,
} from './model/kakao-map.types';
import type {
  MapLoadError,
  MapLocationError,
  MapMarker,
  MapMarkerImage,
  MapCenterChangeSource,
  MapViewport,
  MapViewportChangeSource,
} from './model/map.types';
import { MyLocation } from './my-location';

const DEFAULT_LEVEL = 5;
const DEFAULT_VIEWPORT_DEBOUNCE_MS = 300;
const SELECTED_MARKER_SCALE = 1.15;
const BRAND_CLUSTER_STYLE = {
  background:
    'radial-gradient(circle, var(--color-bg-brand-solid) 0%, var(--color-bg-brand-solid) 42%, var(--transparent) 100%)',
  borderRadius: '50%',
  color: 'var(--color-fg-neutral-inverted)',
  fontWeight: 700,
  height: '48px',
  lineHeight: '48px',
  textAlign: 'center',
  width: '48px',
};

type MapStatus = 'loading' | 'ready' | 'error';

export type MapProps = {
  apiKey?: string;
  center?: MapCoordinate;
  children?: ReactNode;
  className?: string;
  centerChangeSource?: MapCenterChangeSource;
  clusterMarkers?: boolean;
  clusterMinLevel?: number;
  defaultCenter?: MapCoordinate;
  defaultLevel?: number;
  locateOnMount?: boolean;
  markerFocusOffset?: { x?: number; y?: number };
  markerFocusLevel?: number;
  markers?: readonly MapMarker[];
  onLoadError?: (error: MapLoadError) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  onUserLocationChange?: (coordinate: MapCoordinate) => void;
  onUserLocationError?: (error: MapLocationError) => void;
  onViewportChange?: (viewport: MapViewport, source?: MapViewportChangeSource) => void;
  onCenterChange?: (center: MapCoordinate) => void;
  selectionMode?: boolean;
  selectionMarker?: MapMarkerImage;
  showCurrentLocationButton?: boolean;
  showZoomControls?: boolean;
  userLocation?: MapCoordinate | null;
  viewportDebounceMs?: number;
};

export type MapRef = {
  requestCurrentLocation: () => void;
  requestLocationPermission: () => void;
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

function createMarkerImage(maps: KakaoMapsApi, kind: 'post' | 'user', scale = 1) {
  const isUserMarker = kind === 'user';
  const width = Math.round((isUserMarker ? 24 : 40) * scale);
  const height = Math.round((isUserMarker ? 24 : 48) * scale);
  const color = isUserMarker ? '#3b82f6' : '#f04452';
  const svg = isUserMarker
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="4"/><circle cx="12" cy="12" r="2.5" fill="white"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><path d="M20 2C10.06 2 2 10.06 2 20c0 12.68 18 26 18 26s18-13.32 18-26C38 10.06 29.94 2 20 2Z" fill="${color}" stroke="white" stroke-width="3"/><circle cx="20" cy="20" r="6" fill="white"/></svg>`;
  const imageUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

  return new maps.MarkerImage(imageUrl, new maps.Size(width, height), {
    offset: new maps.Point(width / 2, height),
  });
}

function createCustomMarkerImage(maps: KakaoMapsApi, image: MapMarkerImage, scale = 1) {
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const offsetX = Math.round((image.offset?.x ?? image.width / 2) * scale);
  const offsetY = Math.round((image.offset?.y ?? image.height) * scale);

  return new maps.MarkerImage(image.src, new maps.Size(width, height), {
    offset: new maps.Point(offsetX, offsetY),
  });
}

function isSameCoordinate(left: MapCoordinate, right: MapCoordinate) {
  return left.lat === right.lat && left.lng === right.lng;
}

function getMarkerFocusCenter(
  maps: KakaoMapsApi,
  map: KakaoMap,
  markerPosition: KakaoLatLng,
  focusOffset: { x?: number; y?: number },
) {
  const offsetX = focusOffset.x ?? 0;
  const offsetY = focusOffset.y ?? 0;
  const projection = map.getProjection();
  const markerPoint = projection.containerPointFromCoords(markerPosition);
  const targetCenterPoint = new maps.Point(markerPoint.x - offsetX, markerPoint.y + offsetY);

  return projection.coordsFromContainerPoint(targetCenterPoint);
}

function MapComponent(
  {
    apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY,
    center,
    centerChangeSource = 'programmatic',
    children,
    className,
    clusterMarkers = true,
    clusterMinLevel = 6,
    defaultCenter = DEFAULT_MAP_CENTER,
    defaultLevel = DEFAULT_LEVEL,
    locateOnMount = false,
    markerFocusOffset,
    markerFocusLevel,
    markers = [],
    onLoadError,
    onMarkerClick,
    onUserLocationChange,
    onUserLocationError,
    onViewportChange,
    onCenterChange,
    selectionMode = false,
    selectionMarker,
    showCurrentLocationButton = true,
    showZoomControls = true,
    userLocation,
    viewportDebounceMs = DEFAULT_VIEWPORT_DEBOUNCE_MS,
  }: MapProps,
  ref: ForwardedRef<MapRef>,
) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const kakaoRef = useRef<KakaoNamespace | null>(null);
  const clustererRef = useRef<KakaoMarkerClusterer | null>(null);
  const viewportTimerRef = useRef<number | null>(null);
  const initialViewportTimerRef = useRef<number | null>(null);
  const viewportEventSequenceRef = useRef(0);
  const viewportSourceRef = useRef<MapViewportChangeSource>('initial');
  const initialViewportEmittedRef = useRef(false);
  const activeDragSequenceRef = useRef<number | null>(null);
  const activeZoomSequenceRef = useRef<number | null>(null);
  const pendingProgrammaticZoomSequenceRef = useRef<number | null>(null);
  const awaitingIdleSequenceRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const pendingLocationRef = useRef<MapCoordinate | null>(null);
  const [status, setStatus] = useState<MapStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userLocationPoint, setUserLocationPoint] = useState<KakaoPoint | null>(null);
  const [isLocationPermissionDialogOpen, setIsLocationPermissionDialogOpen] = useState(false);

  const currentLocation = useLocationStore((state) => state.coordinate);
  const isLocating = useLocationStore((state) => state.isLoading);
  const setCoordinate = useLocationStore((state) => state.setCoordinate);
  const setPermissionStatus = useLocationStore((state) => state.setPermissionStatus);
  const setLoading = useLocationStore((state) => state.setLoading);
  const setLocationError = useLocationStore((state) => state.setError);
  const currentLocationRef = useRef<MapCoordinate | null>(currentLocation);

  const markerLocation = userLocation ?? currentLocation;
  const initialCenterRef = useRef(center ?? markerLocation ?? defaultCenter);
  const markerLocationRef = useRef<MapCoordinate | null>(markerLocation);
  const markerList = useMemo(() => [...markers], [markers]);

  const onLoadErrorRef = useRef(onLoadError);
  const onMarkerClickRef = useRef(onMarkerClick);
  const markerFocusOffsetRef = useRef(markerFocusOffset);
  const markerFocusLevelRef = useRef(markerFocusLevel);
  const onUserLocationChangeRef = useRef(onUserLocationChange);
  const onUserLocationErrorRef = useRef(onUserLocationError);
  const onViewportChangeRef = useRef(onViewportChange);
  const onCenterChangeRef = useRef(onCenterChange);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
    onMarkerClickRef.current = onMarkerClick;
    markerFocusOffsetRef.current = markerFocusOffset;
    markerFocusLevelRef.current = markerFocusLevel;
    onUserLocationChangeRef.current = onUserLocationChange;
    onUserLocationErrorRef.current = onUserLocationError;
    onViewportChangeRef.current = onViewportChange;
    onCenterChangeRef.current = onCenterChange;
  }, [
    onLoadError,
    onMarkerClick,
    markerFocusOffset,
    markerFocusLevel,
    onUserLocationChange,
    onUserLocationError,
    onViewportChange,
    onCenterChange,
  ]);

  const updateUserLocationPoint = useCallback(() => {
    const map = mapRef.current;
    const kakao = kakaoRef.current;
    const location = markerLocationRef.current;

    if (!map || !kakao || !location) {
      setUserLocationPoint(null);
      return;
    }

    const point = map
      .getProjection()
      .containerPointFromCoords(new kakao.maps.LatLng(location.lat, location.lng));

    setUserLocationPoint((previousPoint) => {
      if (previousPoint?.x === point.x && previousPoint.y === point.y) {
        return previousPoint;
      }

      return { x: point.x, y: point.y };
    });
  }, []);

  const emitMapState = useCallback(
    (source: MapViewportChangeSource, eventSequence: number) => {
      if (eventSequence !== viewportEventSequenceRef.current) {
        return;
      }

      if (source === 'initial' && initialViewportEmittedRef.current) {
        return;
      }

      const map = mapRef.current;

      if (!map) {
        return;
      }

      updateUserLocationPoint();

      const mapCenter = toMapCoordinate(map.getCenter());
      const viewport = toMapViewport(map.getBounds());

      if (source === 'initial') {
        initialViewportEmittedRef.current = true;
      }

      onViewportChangeRef.current?.(viewport, source);
      onCenterChangeRef.current?.(mapCenter);
    },
    [updateUserLocationPoint],
  );

  const beginMapMovement = useCallback(
    (source: MapViewportChangeSource) => {
      if (viewportTimerRef.current !== null) {
        window.clearTimeout(viewportTimerRef.current);
        viewportTimerRef.current = null;
      }

      if (!initialViewportEmittedRef.current && mapRef.current) {
        if (initialViewportTimerRef.current !== null) {
          window.clearTimeout(initialViewportTimerRef.current);
          initialViewportTimerRef.current = null;
        }
        emitMapState('initial', viewportEventSequenceRef.current);
      }

      const eventSequence = viewportEventSequenceRef.current + 1;

      viewportEventSequenceRef.current = eventSequence;
      viewportSourceRef.current = source;
      awaitingIdleSequenceRef.current = source === 'drag' ? null : eventSequence;

      return eventSequence;
    },
    [emitMapState],
  );

  const scheduleMapState = useCallback(
    (source: MapViewportChangeSource, eventSequence: number) => {
      if (viewportTimerRef.current !== null) {
        window.clearTimeout(viewportTimerRef.current);
      }

      viewportTimerRef.current = window.setTimeout(() => {
        viewportTimerRef.current = null;
        emitMapState(source, eventSequence);
      }, viewportDebounceMs);
    },
    [emitMapState, viewportDebounceMs],
  );

  const runMapMovement = useCallback(
    (
      source: MapViewportChangeSource,
      changeMap: () => void,
      { waitForIdle = true }: { waitForIdle?: boolean } = {},
    ) => {
      beginMapMovement(source);

      changeMap();

      if (!waitForIdle) {
        const eventSequence = viewportEventSequenceRef.current;

        awaitingIdleSequenceRef.current = null;
        scheduleMapState(source, eventSequence);
      }
    },
    [beginMapMovement, scheduleMapState],
  );

  const emitInitialMapState = useCallback(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    emitMapState('initial', viewportEventSequenceRef.current);
  }, [emitMapState]);

  useEffect(() => {
    let cancelled = false;
    let idleHandler: (() => void) | null = null;
    let dragStartHandler: (() => void) | null = null;
    let dragEndHandler: (() => void) | null = null;
    let zoomStartHandler: (() => void) | null = null;
    let zoomChangedHandler: (() => void) | null = null;
    let boundsChangedHandler: (() => void) | null = null;

    initialViewportEmittedRef.current = false;
    viewportEventSequenceRef.current += 1;
    viewportSourceRef.current = 'initial';
    activeDragSequenceRef.current = null;
    activeZoomSequenceRef.current = null;
    pendingProgrammaticZoomSequenceRef.current = null;
    awaitingIdleSequenceRef.current = null;
    isDraggingRef.current = false;

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
        idleHandler = () => {
          const eventSequence = awaitingIdleSequenceRef.current;

          if (
            isDraggingRef.current ||
            eventSequence === null ||
            eventSequence !== viewportEventSequenceRef.current
          ) {
            return;
          }

          awaitingIdleSequenceRef.current = null;
          scheduleMapState(viewportSourceRef.current, eventSequence);
        };
        dragStartHandler = () => {
          isDraggingRef.current = true;
          activeDragSequenceRef.current = beginMapMovement('drag');
        };
        dragEndHandler = () => {
          const eventSequence = activeDragSequenceRef.current;

          isDraggingRef.current = false;
          activeDragSequenceRef.current = null;

          if (
            eventSequence !== null &&
            eventSequence === viewportEventSequenceRef.current &&
            viewportSourceRef.current === 'drag'
          ) {
            scheduleMapState('drag', eventSequence);
          }
        };
        zoomStartHandler = () => {
          const programmaticSequence = pendingProgrammaticZoomSequenceRef.current;

          pendingProgrammaticZoomSequenceRef.current = null;
          activeZoomSequenceRef.current = programmaticSequence ?? beginMapMovement('zoom');
        };
        zoomChangedHandler = () => {
          const eventSequence =
            activeZoomSequenceRef.current ?? pendingProgrammaticZoomSequenceRef.current;

          activeZoomSequenceRef.current = null;
          pendingProgrammaticZoomSequenceRef.current = null;

          if (eventSequence !== null && eventSequence === viewportEventSequenceRef.current) {
            awaitingIdleSequenceRef.current = eventSequence;
          }
        };
        boundsChangedHandler = updateUserLocationPoint;
        maps.event.addListener(map, 'idle', idleHandler);
        maps.event.addListener(map, 'dragstart', dragStartHandler);
        maps.event.addListener(map, 'dragend', dragEndHandler);
        maps.event.addListener(map, 'zoom_start', zoomStartHandler);
        maps.event.addListener(map, 'zoom_changed', zoomChangedHandler);
        maps.event.addListener(map, 'bounds_changed', boundsChangedHandler);
        setStatus('ready');

        if (pendingLocationRef.current) {
          const pendingLocation = pendingLocationRef.current;

          pendingLocationRef.current = null;
          runMapMovement('locate', () =>
            map.panTo(new maps.LatLng(pendingLocation.lat, pendingLocation.lng)),
          );
        } else {
          initialViewportTimerRef.current = window.setTimeout(() => {
            initialViewportTimerRef.current = null;
            emitInitialMapState();
          }, 0);
        }
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

      if (initialViewportTimerRef.current !== null) {
        window.clearTimeout(initialViewportTimerRef.current);
        initialViewportTimerRef.current = null;
      }

      if (mapRef.current && kakaoRef.current) {
        if (idleHandler) {
          kakaoRef.current.maps.event.removeListener(mapRef.current, 'idle', idleHandler);
        }
        if (dragStartHandler) {
          kakaoRef.current.maps.event.removeListener(mapRef.current, 'dragstart', dragStartHandler);
        }
        if (dragEndHandler) {
          kakaoRef.current.maps.event.removeListener(mapRef.current, 'dragend', dragEndHandler);
        }
        if (zoomStartHandler) {
          kakaoRef.current.maps.event.removeListener(
            mapRef.current,
            'zoom_start',
            zoomStartHandler,
          );
        }
        if (zoomChangedHandler) {
          kakaoRef.current.maps.event.removeListener(
            mapRef.current,
            'zoom_changed',
            zoomChangedHandler,
          );
        }
        if (boundsChangedHandler) {
          kakaoRef.current.maps.event.removeListener(
            mapRef.current,
            'bounds_changed',
            boundsChangedHandler,
          );
        }
      }

      clustererRef.current?.setMap(null);
      clustererRef.current = null;
      mapRef.current = null;
      kakaoRef.current = null;
    };
  }, [
    apiKey,
    beginMapMovement,
    defaultLevel,
    emitInitialMapState,
    runMapMovement,
    scheduleMapState,
    updateUserLocationPoint,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const kakao = kakaoRef.current;

    if (status !== 'ready' || !map || !kakao) {
      return;
    }

    if (center) {
      const centerPosition = new kakao.maps.LatLng(center.lat, center.lng);
      const focusOffset = markerFocusOffsetRef.current;
      const targetLevel = Math.min(Math.max(markerFocusLevelRef.current ?? map.getLevel(), 1), 14);

      const shouldChangeLevel = map.getLevel() !== targetLevel;
      const shouldChangeCenter = Boolean(
        focusOffset || !isSameCoordinate(center, toMapCoordinate(map.getCenter())),
      );

      if (!shouldChangeLevel && !shouldChangeCenter) {
        return;
      }

      runMapMovement(centerChangeSource, () => {
        if (shouldChangeLevel) {
          pendingProgrammaticZoomSequenceRef.current = viewportEventSequenceRef.current;
          map.setLevel(targetLevel, {
            anchor: centerPosition,
            animate: !focusOffset,
          });
        }

        if (focusOffset) {
          map.panTo(getMarkerFocusCenter(kakao.maps, map, centerPosition, focusOffset));
        } else if (shouldChangeCenter) {
          map.setCenter(centerPosition);
        }
      });
    }
  }, [center, centerChangeSource, runMapMovement, status]);

  useEffect(() => {
    const map = mapRef.current;
    const kakao = kakaoRef.current;

    if (status !== 'ready' || !map || !kakao) {
      return;
    }

    const markerInstances: KakaoMarker[] = [];
    markerList.forEach((markerData) => {
      const position = new kakao.maps.LatLng(markerData.position.lat, markerData.position.lng);
      const markerScale = markerData.isSelected ? SELECTED_MARKER_SCALE : 1;
      const marker = new kakao.maps.Marker({
        image: markerData.image
          ? createCustomMarkerImage(kakao.maps, markerData.image, markerScale)
          : createMarkerImage(kakao.maps, 'post', markerScale),
        position,
        title: markerData.title,
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        const focusOffset = markerFocusOffsetRef.current;
        const targetLevel = Math.min(
          Math.max(markerFocusLevelRef.current ?? map.getLevel() - 1, 1),
          14,
        );
        const shouldChangeLevel =
          markerFocusLevelRef.current === undefined || map.getLevel() !== targetLevel;

        runMapMovement('selection', () => {
          if (shouldChangeLevel) {
            pendingProgrammaticZoomSequenceRef.current = viewportEventSequenceRef.current;
            map.setLevel(targetLevel, {
              anchor: position,
              animate: !focusOffset,
            });
          }

          if (focusOffset) {
            map.panTo(getMarkerFocusCenter(kakao.maps, map, position, focusOffset));
          } else {
            map.panTo(position);
          }
        });

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
        styles: [BRAND_CLUSTER_STYLE],
      });

      kakao.maps.event.addListener(clusterer, 'clusterclick', (cluster) => {
        const nextLevel = Math.max(map.getLevel() - 1, 1);

        runMapMovement('zoom', () => {
          pendingProgrammaticZoomSequenceRef.current = viewportEventSequenceRef.current;
          map.setLevel(nextLevel, {
            anchor: cluster.getCenter(),
            animate: true,
          });
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
  }, [clusterMarkers, clusterMinLevel, markerList, runMapMovement, status]);

  useEffect(() => {
    currentLocationRef.current = currentLocation;
    markerLocationRef.current = markerLocation;

    if (status === 'ready') {
      updateUserLocationPoint();
    }
  }, [currentLocation, markerLocation, status, updateUserLocationPoint]);

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

    const observer = new ResizeObserver(() => {
      runMapMovement('programmatic', () => map.relayout(), { waitForIdle: false });
    });

    observer.observe(mapContainerRef.current);

    return () => observer.disconnect();
  }, [runMapMovement, status]);

  const handleZoom = useCallback(
    (direction: 'in' | 'out') => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      const delta = direction === 'in' ? -1 : 1;
      const nextLevel = Math.min(Math.max(map.getLevel() + delta, 1), 14);

      if (nextLevel !== map.getLevel()) {
        runMapMovement('zoom', () => {
          pendingProgrammaticZoomSequenceRef.current = viewportEventSequenceRef.current;
          map.setLevel(nextLevel, { animate: true });
        });
      }
    },
    [runMapMovement],
  );

  const reportLocationError = useCallback(
    (error: MapLocationError) => {
      setLoading(false);
      setPermissionStatus(error.code === 'permission-denied' ? 'denied' : 'unavailable');
      setLocationError(error.message);
      setIsLocationPermissionDialogOpen(error.code === 'permission-denied');
      onUserLocationErrorRef.current?.(error);
    },
    [setLoading, setLocationError, setPermissionStatus],
  );

  const centerMapOnLocation = useCallback(
    (coordinate: MapCoordinate) => {
      const map = mapRef.current;
      const kakao = kakaoRef.current;

      if (map && kakao) {
        runMapMovement(
          'locate',
          () => map.setCenter(new kakao.maps.LatLng(coordinate.lat, coordinate.lng)),
          { waitForIdle: false },
        );
      } else {
        pendingLocationRef.current = coordinate;
      }
    },
    [runMapMovement],
  );

  const handleCurrentLocation = useCallback(
    (maximumAge = 30_000) => {
      const knownLocation = currentLocationRef.current;

      if (knownLocation && maximumAge > 0) {
        centerMapOnLocation(knownLocation);
      }

      if (!navigator.geolocation) {
        reportLocationError({
          code: 'unsupported',
          message: '이 브라우저에서는 현재 위치를 사용할 수 없습니다.',
        });
        return;
      }

      setLoading(true);
      setPermissionStatus('requesting');
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const coordinate = {
            lat: coords.latitude,
            lng: coords.longitude,
          };

          setCoordinate(coordinate);
          setPermissionStatus('granted');
          setLoading(false);
          setLocationError(null);
          setIsLocationPermissionDialogOpen(false);
          onUserLocationChangeRef.current?.(coordinate);
          centerMapOnLocation(coordinate);
        },
        (positionError) => reportLocationError(getMapLocationError(positionError)),
        {
          enableHighAccuracy: true,
          maximumAge,
          timeout: 10_000,
        },
      );
    },
    [
      centerMapOnLocation,
      reportLocationError,
      setCoordinate,
      setLoading,
      setLocationError,
      setPermissionStatus,
    ],
  );

  const requestLocationPermission = useCallback(() => {
    handleCurrentLocation(0);
  }, [handleCurrentLocation]);

  useImperativeHandle(
    ref,
    () => ({ requestCurrentLocation: () => handleCurrentLocation(), requestLocationPermission }),
    [handleCurrentLocation, requestLocationPermission],
  );

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

      {status === 'ready' && userLocationPoint ? (
        <MyLocation
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: userLocationPoint.x, top: userLocationPoint.y }}
        />
      ) : null}

      {children}

      {selectionMode ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-full"
          data-testid="map-selection-marker"
        >
          {selectionMarker ? (
            <Image
              alt=""
              aria-hidden="true"
              className="block"
              height={selectionMarker.height}
              src={selectionMarker.src}
              unoptimized
              width={selectionMarker.width}
            />
          ) : (
            <>
              <span className="block size-10 rounded-full border-[3px] border-white bg-[var(--color-bg-brand-solid)] shadow-[0_3px_8px_rgb(0_0_0_/_24%)]" />
              <span className="absolute bottom-[-5px] left-1/2 size-3 -translate-x-1/2 rotate-45 bg-[var(--color-bg-brand-solid)]" />
            </>
          )}
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
          onClick={() => handleCurrentLocation()}
        >
          <Icon color="var(--color-fg-brand)" name="crosshair" size={22} />
        </MapControlButton>
      ) : null}

      <Dialog
        className="!w-[calc(100%-40px)] !max-w-[353px]"
        description="브라우저 위치 권한이 필요한 기능이에요."
        onOpenChange={setIsLocationPermissionDialogOpen}
        open={isLocationPermissionDialogOpen}
        title="위치 권한을 활성화해주세요"
      />
    </div>
  );
}

export const Map = forwardRef<MapRef, MapProps>(MapComponent);
