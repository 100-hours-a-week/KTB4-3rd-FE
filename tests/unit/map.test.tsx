import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, type Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocationStore } from '@/shared/model/stores/location-store';
import type {
  KakaoCluster,
  KakaoLatLng,
  KakaoLatLngBounds,
  KakaoMap,
  KakaoMarker,
  KakaoMarkerClusterer,
  KakaoMarkerClustererStyle,
  KakaoMapProjection,
  KakaoNamespace,
} from '@/shared/ui/map/model/kakao-map.types';
import {
  Map,
  type MapLocationError,
  type MapMarker,
  type MapProps,
  type MapRef,
  type MapViewport,
  type MapViewportChangeSource,
} from '@/shared/ui/map';
import type { MapCoordinate } from '@/shared/types/common';

const { loadKakaoMaps } = vi.hoisted(() => ({
  loadKakaoMaps: vi.fn<(apiKey: string) => Promise<KakaoNamespace>>(),
}));

vi.mock('@/shared/ui/map/model/map-loader', () => ({
  loadKakaoMaps,
}));

class FakeLatLng implements KakaoLatLng {
  constructor(
    private readonly lat: number,
    private readonly lng: number,
  ) {}

  getLat() {
    return this.lat;
  }

  getLng() {
    return this.lng;
  }
}

const fakeBounds: KakaoLatLngBounds = {
  getNorthEast: () => new FakeLatLng(37.6, 127.1),
  getSouthWest: () => new FakeLatLng(37.4, 126.8),
};

class FakeMap implements KakaoMap {
  getBounds = vi.fn<() => KakaoLatLngBounds>(() => fakeBounds);
  getCenter = vi.fn<() => KakaoLatLng>(() => new FakeLatLng(37.5665, 126.978));
  getLevel = vi.fn<() => number>(() => 5);
  getProjection = vi.fn<() => KakaoMapProjection>(() => ({
    containerPointFromCoords: vi.fn<() => { x: number; y: number }>(
      () => projectedUserLocationPoint,
    ),
    coordsFromContainerPoint: vi.fn<() => KakaoLatLng>(() => new FakeLatLng(37.51, 127.02)),
  }));
  panTo = vi.fn<(position: KakaoLatLng) => void>();
  relayout = vi.fn<() => void>();
  setCenter = vi.fn<(position: KakaoLatLng) => void>();
  setLevel =
    vi.fn<(level: number, options?: { anchor?: KakaoLatLng; animate?: boolean }) => void>();
}

class FakeMarker implements KakaoMarker {
  constructor(options: { position: KakaoLatLng; title?: string }) {
    markerOptions.push(options);
  }

  setMap = vi.fn<(map: KakaoMap | null) => void>();
}

class FakeMarkerClusterer implements KakaoMarkerClusterer {
  constructor(options: { styles?: KakaoMarkerClustererStyle[] }) {
    clustererOptions.push(options);
  }

  addMarkers = vi.fn<(markers: KakaoMarker[]) => void>();
  clear = vi.fn<() => void>();
  setMap = vi.fn<(map: KakaoMap | null) => void>();
}

const markerClickHandlers: (() => void)[] = [];
const clusterClickHandlers: ((cluster: KakaoCluster) => void)[] = [];
const boundsChangedHandlers: (() => void)[] = [];
let mapEventHandlers: Record<string, (() => void)[]> = {};
const clustererOptions: { styles?: KakaoMarkerClustererStyle[] }[] = [];
const markerOptions: { position: KakaoLatLng; title?: string }[] = [];
const markerImageSources: string[] = [];
const markerImageOptions: { height: number; offsetX: number; offsetY: number; width: number }[] =
  [];
const mapCreationOptions: { center: KakaoLatLng; level: number }[] = [];
let projectedUserLocationPoint = { x: 0, y: 0 };
let fakeMap: FakeMap;

class FakeMarkerImage {
  constructor(
    src: string,
    size: { height: number; width: number },
    options: { offset: { x: number; y: number } },
  ) {
    markerImageSources.push(src);
    markerImageOptions.push({
      height: size.height,
      offsetX: options.offset.x,
      offsetY: options.offset.y,
      width: size.width,
    });
  }
}

class FakeSize {
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}
}

class FakePoint {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}
}

const fakeKakao = {
  maps: {
    LatLng: FakeLatLng,
    Map: function fakeMapConstructor(
      _container: HTMLElement,
      options: { center: KakaoLatLng; level: number },
    ) {
      mapCreationOptions.push(options);
      fakeMap = new FakeMap();
      return fakeMap;
    },
    Marker: FakeMarker,
    MarkerClusterer: FakeMarkerClusterer,
    MarkerImage: FakeMarkerImage,
    Point: FakePoint,
    Size: FakeSize,
    event: {
      addListener: vi.fn<(target: object, eventName: string, handler: unknown) => void>(
        (target, eventName, handler) => {
          if (target === fakeMap) {
            (mapEventHandlers[eventName] ??= []).push(handler as () => void);
          }
          if (eventName === 'click') {
            markerClickHandlers.push(handler as () => void);
          }

          if (eventName === 'clusterclick') {
            clusterClickHandlers.push(handler as (cluster: KakaoCluster) => void);
          }

          if (eventName === 'bounds_changed') {
            boundsChangedHandlers.push(handler as () => void);
          }
        },
      ),
      removeListener: vi.fn<(target: object, eventName: string, handler: unknown) => void>(),
    },
    load: vi.fn<() => void>(),
  },
} as unknown as KakaoNamespace;

describe('Map', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    markerClickHandlers.length = 0;
    clusterClickHandlers.length = 0;
    boundsChangedHandlers.length = 0;
    mapEventHandlers = {};
    clustererOptions.length = 0;
    markerOptions.length = 0;
    markerImageSources.length = 0;
    markerImageOptions.length = 0;
    mapCreationOptions.length = 0;
    projectedUserLocationPoint = { x: 0, y: 0 };
    useLocationStore.getState().reset();
    fakeMap = new FakeMap();
    loadKakaoMaps.mockResolvedValue(fakeKakao);
  });

  it('renders map controls and emits the initial viewport and center', async () => {
    const onViewportChange = vi.fn<(viewport: MapViewport) => void>();
    const onCenterChange = vi.fn<(center: MapCoordinate) => void>();

    render(
      <Map
        apiKey="test-key"
        onCenterChange={onCenterChange}
        onViewportChange={onViewportChange}
        viewportDebounceMs={0}
      />,
    );

    expect(await screen.findByRole('button', { name: '지도 확대' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '지도 축소' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '현재 위치로 이동' })).toBeInTheDocument();
    expect(onViewportChange).toHaveBeenCalledWith(
      {
        northEast: { lat: 37.6, lng: 127.1 },
        northWest: { lat: 37.6, lng: 126.8 },
        southEast: { lat: 37.4, lng: 127.1 },
        southWest: { lat: 37.4, lng: 126.8 },
      },
      'initial',
    );
    expect(onCenterChange).toHaveBeenCalledWith({ lat: 37.5665, lng: 126.978 });
  });

  it('uses Seoul Station as the default initial center', async () => {
    render(<Map apiKey="test-key" />);

    await waitFor(() => expect(mapCreationOptions).toHaveLength(1));

    expect(mapCreationOptions[0]?.center.getLat()).toBeCloseTo(37.5547);
    expect(mapCreationOptions[0]?.center.getLng()).toBeCloseTo(126.9707);
  });

  it('requests the current location on mount and renders MyLocation after success', async () => {
    const getCurrentPosition = vi.fn<(success: PositionCallback) => void>((success) =>
      success({
        coords: {
          latitude: 37.51,
          longitude: 127.02,
        } as GeolocationCoordinates,
      } as GeolocationPosition),
    );

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<Map apiKey="test-key" locateOnMount />);

    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalledOnce());
    expect(await screen.findByRole('img', { name: '현재 위치' })).toBeInTheDocument();
    expect(fakeMap.setCenter).toHaveBeenCalledOnce();
  });

  it('reprojects MyLocation while the map is dragged or zoomed', async () => {
    const getCurrentPosition = vi.fn<(success: PositionCallback) => void>((success) =>
      success({
        coords: {
          latitude: 37.51,
          longitude: 127.02,
        } as GeolocationCoordinates,
      } as GeolocationPosition),
    );

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    projectedUserLocationPoint = { x: 120, y: 180 };
    render(<Map apiKey="test-key" locateOnMount />);

    const userLocation = await screen.findByRole('img', { name: '현재 위치' });

    expect(userLocation).toHaveStyle({ left: '120px', top: '180px' });
    await waitFor(() => expect(boundsChangedHandlers).toHaveLength(1));

    projectedUserLocationPoint = { x: 48, y: 76 };
    boundsChangedHandlers[0]?.();

    await waitFor(() => {
      expect(userLocation).toHaveStyle({ left: '48px', top: '76px' });
    });

    projectedUserLocationPoint = { x: 24, y: 42 };
    boundsChangedHandlers[0]?.();

    await waitFor(() => {
      expect(userLocation).toHaveStyle({ left: '24px', top: '42px' });
    });
  });

  it('reports a location error and keeps MyLocation hidden after a failed request', async () => {
    const onUserLocationError = vi.fn<(error: MapLocationError) => void>();
    const getCurrentPosition = vi.fn<
      (success: PositionCallback, error?: PositionErrorCallback) => void
    >((_success, error) =>
      error?.({
        code: 1,
        message: 'permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError),
    );

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<Map apiKey="test-key" locateOnMount onUserLocationError={onUserLocationError} />);

    await waitFor(() =>
      expect(onUserLocationError).toHaveBeenCalledWith({
        code: 'permission-denied',
        message: '위치 권한이 없어 현재 위치를 가져올 수 없습니다.',
      }),
    );
    expect(screen.getByRole('dialog', { name: '위치 권한을 활성화해주세요' })).toHaveClass(
      '!w-[calc(100%-40px)]',
      '!max-w-[353px]',
    );
    expect(screen.getByText('브라우저 위치 권한이 필요한 기능이에요.')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '현재 위치' })).not.toBeInTheDocument();
  });

  it('centers on the last known location before requesting a fresh position', async () => {
    const knownLocation = { lat: 37.51, lng: 127.02 };
    const getCurrentPosition = vi.fn<
      (success: PositionCallback, error?: PositionErrorCallback) => void
    >((_success, error) =>
      error?.({
        code: 2,
        message: 'position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError),
    );

    useLocationStore.getState().setCoordinate(knownLocation);
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<Map apiKey="test-key" />);

    fireEvent.click(await screen.findByRole('button', { name: '현재 위치로 이동' }));

    expect(fakeMap.setCenter).toHaveBeenCalledOnce();
    const centeredPosition = fakeMap.setCenter.mock.calls[0]?.[0];
    expect(centeredPosition?.getLat()).toBe(knownLocation.lat);
    expect(centeredPosition?.getLng()).toBe(knownLocation.lng);
  });

  it('exposes a current location request for a custom location button', async () => {
    const mapRef = createRef<MapRef>();
    const getCurrentPosition = vi.fn<(success: PositionCallback) => void>();

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<Map apiKey="test-key" ref={mapRef} />);

    await waitFor(() => expect(mapRef.current).not.toBeNull());
    mapRef.current?.requestCurrentLocation();

    expect(getCurrentPosition).toHaveBeenCalledOnce();
  });

  it('requests a fresh browser location when permission is explicitly requested', async () => {
    const mapRef = createRef<MapRef>();
    const getCurrentPosition = vi.fn<(success: PositionCallback) => void>();

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<Map apiKey="test-key" ref={mapRef} />);

    await waitFor(() => expect(mapRef.current).not.toBeNull());
    mapRef.current?.requestLocationPermission();

    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ maximumAge: 0 }),
    );
  });

  it('moves the map when zoom and current location controls are used', async () => {
    const onUserLocationChange = vi.fn<(coordinate: MapCoordinate) => void>();
    const getCurrentPosition = vi.fn<(success: PositionCallback) => void>((success) =>
      success({
        coords: {
          latitude: 37.51,
          longitude: 127.02,
        } as GeolocationCoordinates,
      } as GeolocationPosition),
    );

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<Map apiKey="test-key" onUserLocationChange={onUserLocationChange} />);

    fireEvent.click(await screen.findByRole('button', { name: '지도 확대' }));
    fireEvent.click(screen.getByRole('button', { name: '현재 위치로 이동' }));

    expect(fakeMap.setLevel).toHaveBeenCalledWith(4, { animate: true });
    expect(onUserLocationChange).toHaveBeenCalledWith({ lat: 37.51, lng: 127.02 });
    expect(fakeMap.setCenter).toHaveBeenCalledOnce();
  });

  it('moves a clicked marker to the requested focus offset and zooms into a clicked cluster', async () => {
    const onMarkerClick = vi.fn<(marker: MapMarker) => void>();

    render(
      <Map
        apiKey="test-key"
        markerFocusLevel={3}
        markerFocusOffset={{ y: 160 }}
        markers={[{ id: 'post-1', position: { lat: 37.51, lng: 127.02 }, title: '게시글' }]}
        onMarkerClick={onMarkerClick}
      />,
    );

    await waitFor(() => expect(markerClickHandlers).toHaveLength(1));
    expect(clustererOptions[0]?.styles).toEqual([
      {
        background:
          'radial-gradient(circle, var(--color-bg-brand-solid) 0%, var(--color-bg-brand-solid) 42%, var(--transparent) 100%)',
        borderRadius: '50%',
        color: 'var(--color-fg-neutral-inverted)',
        fontWeight: 700,
        height: '48px',
        lineHeight: '48px',
        textAlign: 'center',
        width: '48px',
      },
    ]);
    expect(markerOptions[0]?.position.getLat()).toBe(37.51);
    expect(markerOptions[0]?.position.getLng()).toBe(127.02);
    markerClickHandlers[0]?.();
    clusterClickHandlers[0]?.({ getCenter: () => new FakeLatLng(37.52, 127.03) });

    expect(onMarkerClick).toHaveBeenCalledWith({
      id: 'post-1',
      position: { lat: 37.51, lng: 127.02 },
      title: '게시글',
    });
    expect(fakeMap.setCenter).not.toHaveBeenCalled();
    expect(fakeMap.panTo).toHaveBeenCalledOnce();
    expect(fakeMap.setLevel).toHaveBeenNthCalledWith(1, 3, {
      anchor: expect.any(FakeLatLng),
      animate: false,
    });
    expect(fakeMap.setLevel).toHaveBeenCalledWith(4, {
      anchor: expect.any(FakeLatLng),
      animate: true,
    });
  });

  it('renders overlay children above the map container', () => {
    render(
      <Map apiKey="test-key">
        <button type="button">게시글 핀</button>
      </Map>,
    );

    expect(screen.getByRole('button', { name: '게시글 핀' })).toBeInTheDocument();
  });

  it('skips repeated zoom and pans naturally when the map is already at the focus level', async () => {
    render(
      <Map
        apiKey="test-key"
        markerFocusLevel={5}
        markerFocusOffset={{ y: 160 }}
        markers={[{ id: 'post-1', position: { lat: 37.51, lng: 127.02 }, title: '게시글' }]}
      />,
    );

    await waitFor(() => expect(markerClickHandlers).toHaveLength(1));
    markerClickHandlers[0]?.();

    expect(fakeMap.setLevel).not.toHaveBeenCalled();
    expect(fakeMap.panTo).toHaveBeenCalledOnce();
  });

  it('uses a custom marker image when one is provided', async () => {
    render(
      <Map
        apiKey="test-key"
        markers={[
          {
            id: 'post-1',
            image: {
              height: 56,
              src: '/map-pins/accompany-marker.svg',
              width: 54,
            },
            position: { lat: 37.51, lng: 127.02 },
          },
        ]}
      />,
    );

    await waitFor(() => expect(markerImageSources).toContain('/map-pins/accompany-marker.svg'));
  });

  it('scales a selected marker while keeping its map position anchored', async () => {
    render(
      <Map
        apiKey="test-key"
        markers={[
          {
            id: 'post-1',
            image: {
              height: 56,
              offset: { x: 27, y: 56 },
              src: '/map-pins/accompany-marker.svg',
              width: 54,
            },
            isSelected: true,
            position: { lat: 37.51, lng: 127.02 },
          },
        ]}
      />,
    );

    await waitFor(() => expect(markerImageOptions).toHaveLength(1));

    expect(markerImageOptions[0]).toEqual({
      height: 64,
      offsetX: 31,
      offsetY: 64,
      width: 62,
    });
  });

  it('renders a fixed selection marker for center-based location picking', async () => {
    render(<Map apiKey="test-key" selectionMode />);

    await waitFor(() => expect(screen.getByTestId('map-selection-marker')).toBeInTheDocument());
  });

  it('renders a custom image for the center selection marker', async () => {
    render(
      <Map
        apiKey="test-key"
        selectionMarker={{
          height: 56,
          src: '/map-pins/accompany-marker.svg',
          width: 54,
        }}
        selectionMode
      />,
    );

    const selectionMarker = await screen.findByTestId('map-selection-marker');

    expect(selectionMarker.querySelector('img')).toHaveAttribute(
      'src',
      '/map-pins/accompany-marker.svg',
    );
  });

  describe('viewport movement sources', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
      cleanup();
      vi.useRealTimers();
    });

    const marker = { id: 'selected', position: { lat: 37.51, lng: 127.02 } };

    function emit(...eventNames: string[]) {
      act(() => {
        eventNames.forEach((eventName) => {
          const handlers = mapEventHandlers[eventName];
          handlers?.forEach((handler) => handler());
        });
      });
    }

    async function advance(milliseconds: number) {
      await act(async () => vi.advanceTimersByTimeAsync(milliseconds));
    }

    async function readyMap(props: Partial<MapProps> & { ref?: Ref<MapRef> } = {}) {
      const onViewportChange =
        vi.fn<(viewport: MapViewport, source?: MapViewportChangeSource) => void>();
      const view = render(<Map apiKey="test-key" onViewportChange={onViewportChange} {...props} />);
      await act(async () => {});
      await advance(0);
      expect(mapCreationOptions).toHaveLength(1);
      return { ...view, onViewportChange };
    }

    it('preserves a single-argument consumer and emits initial only once', async () => {
      const onViewportChange = vi.fn<(viewport: MapViewport) => number>(
        (viewport) => viewport.northEast.lat,
      );
      await readyMap({ onViewportChange });

      expect(onViewportChange.mock.results[0]?.value).toBe(37.6);
      expect(onViewportChange.mock.calls[0]?.[0]).toEqual({
        northEast: { lat: 37.6, lng: 127.1 },
        northWest: { lat: 37.6, lng: 126.8 },
        southEast: { lat: 37.4, lng: 127.1 },
        southWest: { lat: 37.4, lng: 126.8 },
      });
      emit('bounds_changed', 'idle', 'idle');
      await advance(300);
      expect(
        (onViewportChange.mock.calls as unknown[][]).filter((call) => call[1] === 'initial'),
      ).toHaveLength(1);
    });

    it('does not infer drag from bounds or idle and debounces completed SDK drags for 300ms', async () => {
      const { onViewportChange } = await readyMap();
      onViewportChange.mockClear();
      emit('bounds_changed', 'idle');
      await advance(300);
      expect(onViewportChange.mock.calls.some(([, source]) => source === 'drag')).toBe(false);
      onViewportChange.mockClear();

      emit('dragstart', 'bounds_changed');
      await advance(400);
      expect(onViewportChange).not.toHaveBeenCalled();
      emit('dragend');
      await advance(299);
      expect(onViewportChange).not.toHaveBeenCalled();
      await advance(1);
      expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), 'drag');
    });

    it('reports resized map bounds as programmatic without requiring an SDK idle event', async () => {
      let notifyResize: (() => void) | undefined;
      const disconnect = vi.fn<() => void>();
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(callback: () => void) {
            notifyResize = callback;
          }
          observe() {}
          disconnect = disconnect;
        },
      );
      try {
        const { onViewportChange, unmount } = await readyMap();
        onViewportChange.mockClear();
        fakeMap.getBounds.mockReturnValue({
          getNorthEast: () => new FakeLatLng(37.7, 127.2),
          getSouthWest: () => new FakeLatLng(37.3, 126.7),
        });
        act(() => notifyResize?.());
        expect(fakeMap.relayout).toHaveBeenCalledOnce();
        await advance(299);
        expect(onViewportChange).not.toHaveBeenCalled();
        await advance(1);
        expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({ northEast: { lat: 37.7, lng: 127.2 } }),
          'programmatic',
        );
        unmount();
        expect(disconnect).toHaveBeenCalledOnce();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('restarts debounce for a newer drag and preserves the latest viewport', async () => {
      const { onViewportChange } = await readyMap();
      onViewportChange.mockClear();
      emit('dragstart', 'dragend');
      await advance(250);
      fakeMap.getBounds.mockReturnValue({
        getNorthEast: () => new FakeLatLng(38, 128),
        getSouthWest: () => new FakeLatLng(37, 127),
      });
      emit('dragstart', 'dragend');
      await advance(299);
      expect(onViewportChange).not.toHaveBeenCalled();
      await advance(1);
      expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(
        {
          northEast: { lat: 38, lng: 128 },
          northWest: { lat: 38, lng: 127 },
          southEast: { lat: 37, lng: 128 },
          southWest: { lat: 37, lng: 127 },
        },
        'drag',
      );
    });

    it.each(['selection', 'programmatic'] as const)(
      'classifies controlled center changes as %s',
      async (source) => {
        const { onViewportChange, rerender } = await readyMap();
        onViewportChange.mockClear();
        rerender(
          <Map
            apiKey="test-key"
            center={marker.position}
            centerChangeSource={source === 'selection' ? source : undefined}
            onViewportChange={onViewportChange}
          />,
        );
        emit('bounds_changed', 'idle');
        await advance(300);

        expect(fakeMap.setCenter).toHaveBeenCalled();
        expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), source);
      },
    );

    it.each(['button', 'sdk', 'cluster'] as const)('classifies %s zoom as zoom', async (kind) => {
      const { onViewportChange } = await readyMap({ markers: [marker] });
      onViewportChange.mockClear();
      act(() => {
        if (kind === 'button') {
          fireEvent.click(screen.getByRole('button', { name: '지도 확대' }));
        }
        if (kind === 'cluster') {
          clusterClickHandlers[0]?.({ getCenter: () => new FakeLatLng(37.52, 127.03) });
        }
      });
      if (kind === 'sdk') {
        emit('zoom_start');
      }
      emit('zoom_changed', 'bounds_changed', 'idle');
      await advance(300);
      expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), 'zoom');
    });

    it('keeps marker selection classified as selection during its zoom events', async () => {
      const { onViewportChange } = await readyMap({ markers: [marker], markerFocusLevel: 3 });
      onViewportChange.mockClear();
      act(() => markerClickHandlers[0]?.());
      emit('zoom_changed', 'bounds_changed', 'idle');
      await advance(300);

      expect(fakeMap.panTo).toHaveBeenCalledOnce();
      expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), 'selection');
    });

    it.each(['selection', 'programmatic'] as const)(
      'keeps %s when setLevel causes deferred SDK zoom events',
      async (source) => {
        const { onViewportChange, rerender } = await readyMap({ markers: [marker] });
        onViewportChange.mockClear();
        fakeMap.setLevel.mockImplementation(() => {
          window.setTimeout(() => emit('zoom_start'), 50);
          window.setTimeout(() => emit('zoom_changed', 'bounds_changed', 'idle'), 60);
        });
        if (source === 'selection') {
          act(() => markerClickHandlers[0]?.());
        } else {
          rerender(
            <Map
              apiKey="test-key"
              center={marker.position}
              markerFocusLevel={3}
              onViewportChange={onViewportChange}
            />,
          );
        }
        await advance(400);
        expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), source);
      },
    );

    it.each(['both-late', 'change-late'] as const)(
      'does not let a prior selection zoom replace a newer drag (%s)',
      async (timing) => {
        const { onViewportChange } = await readyMap({ markers: [marker] });
        onViewportChange.mockClear();
        fakeMap.setLevel.mockImplementation(() => {
          if (timing === 'change-late') {
            emit('zoom_start');
          } else {
            window.setTimeout(() => emit('zoom_start'), 100);
          }
          window.setTimeout(() => emit('zoom_changed', 'idle'), 110);
        });
        act(() => markerClickHandlers[0]?.());
        await advance(50);
        emit('dragstart', 'dragend');
        await advance(299);
        expect(onViewportChange).not.toHaveBeenCalled();
        await advance(1);
        expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), 'drag');
      },
    );

    it.each(['selection', 'zoom'] as const)(
      'delivers the final %s viewport when animation settles after the debounce interval',
      async (source) => {
        const { onViewportChange } = await readyMap({ markers: [marker] });
        onViewportChange.mockClear();
        act(() => {
          if (source === 'selection') {
            markerClickHandlers[0]?.();
          } else {
            fireEvent.click(screen.getByRole('button', { name: '지도 확대' }));
          }
        });
        await advance(600);
        fakeMap.getBounds.mockReturnValue({
          getNorthEast: () => new FakeLatLng(38, 128),
          getSouthWest: () => new FakeLatLng(37, 127),
        });
        emit('bounds_changed', 'idle');
        await advance(300);
        expect(onViewportChange).toHaveBeenLastCalledWith(
          {
            northEast: { lat: 38, lng: 128 },
            northWest: { lat: 38, lng: 127 },
            southEast: { lat: 37, lng: 128 },
            southWest: { lat: 37, lng: 127 },
          },
          source,
        );
      },
    );

    it.each(['selection', 'zoom', 'locate'] as const)(
      'invalidates a pending drag when %s becomes the latest cause, including late dragend/idle',
      async (source) => {
        const mapRef = createRef<MapRef>();
        Object.defineProperty(navigator, 'geolocation', {
          configurable: true,
          value: {
            getCurrentPosition: (success: PositionCallback) =>
              success({
                coords: { latitude: 37.51, longitude: 127.02 },
              } as GeolocationPosition),
          },
        });
        const { onViewportChange } = await readyMap({ ref: mapRef, markers: [marker] });
        onViewportChange.mockClear();
        emit('dragstart', 'dragend');
        await advance(150);
        act(() => {
          if (source === 'selection') {
            markerClickHandlers[0]?.();
          }
          if (source === 'zoom') {
            fireEvent.click(screen.getByRole('button', { name: '지도 확대' }));
          }
          if (source === 'locate') {
            mapRef.current?.requestCurrentLocation();
          }
        });
        emit('dragend', 'bounds_changed', 'idle');
        await advance(300);

        expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), source);
      },
    );

    it('emits initial once when locating completes before the SDK loads, then emits locate', async () => {
      let resolveSdk!: (sdk: KakaoNamespace) => void;
      loadKakaoMaps.mockReturnValue(
        new Promise((resolve) => {
          resolveSdk = resolve;
        }),
      );
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (success: PositionCallback) =>
            success({
              coords: { latitude: 37.51, longitude: 127.02 },
            } as GeolocationPosition),
        },
      });
      const mapRef = createRef<MapRef>();
      const onViewportChange =
        vi.fn<(viewport: MapViewport, source?: MapViewportChangeSource) => void>();
      render(
        <Map apiKey="test-key" locateOnMount onViewportChange={onViewportChange} ref={mapRef} />,
      );
      await advance(0);
      expect(onViewportChange).not.toHaveBeenCalled();
      await act(async () => resolveSdk(fakeKakao));
      await advance(0);
      expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), 'initial');
      onViewportChange.mockClear();
      act(() => mapRef.current?.requestCurrentLocation());
      emit('bounds_changed', 'idle');
      await advance(300);
      expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), 'locate');
    });

    it('labels both the cached location and a later fresh position as locate', async () => {
      let completeLocation: PositionCallback | undefined;
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (success: PositionCallback) => {
            completeLocation = success;
          },
        },
      });
      useLocationStore.getState().setCoordinate({ lat: 37.5, lng: 127 });
      const mapRef = createRef<MapRef>();
      const { onViewportChange } = await readyMap({ ref: mapRef });
      onViewportChange.mockClear();
      act(() => mapRef.current?.requestCurrentLocation());
      await advance(300);
      expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), 'locate');
      expect(fakeMap.setCenter.mock.calls[0]?.[0].getLat()).toBe(37.5);
      onViewportChange.mockClear();
      act(() =>
        completeLocation?.({ coords: { latitude: 37.6, longitude: 127.1 } } as GeolocationPosition),
      );
      emit('bounds_changed', 'idle');
      await advance(300);
      expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(expect.any(Object), 'locate');
      expect(fakeMap.setCenter.mock.calls[1]?.[0].getLat()).toBe(37.6);
    });

    it('removes every SDK map listener and cancels pending viewport timers on unmount', async () => {
      const { onViewportChange, unmount } = await readyMap();
      onViewportChange.mockClear();
      emit('dragstart', 'dragend');
      const registered = vi
        .mocked(fakeKakao.maps.event.addListener)
        .mock.calls.filter(([target]) => target === fakeMap);
      unmount();
      await advance(300);

      expect(onViewportChange).not.toHaveBeenCalled();
      registered.forEach(([target, name, handler]) => {
        expect(fakeKakao.maps.event.removeListener).toHaveBeenCalledWith(target, name, handler);
      });
    });

    it('does not emit the pending initial viewport after unmount', async () => {
      const onViewportChange =
        vi.fn<(viewport: MapViewport, source?: MapViewportChangeSource) => void>();
      const { unmount } = render(<Map apiKey="test-key" onViewportChange={onViewportChange} />);
      await act(async () => {});
      unmount();
      await advance(300);
      expect(onViewportChange).not.toHaveBeenCalled();
    });
  });
});
