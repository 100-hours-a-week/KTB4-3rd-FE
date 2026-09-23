import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
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
  type MapRef,
  type MapViewport,
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
        (_target, eventName, handler) => {
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
    expect(onViewportChange).toHaveBeenCalledWith({
      northEast: { lat: 37.6, lng: 127.1 },
      northWest: { lat: 37.6, lng: 126.8 },
      southEast: { lat: 37.4, lng: 127.1 },
      southWest: { lat: 37.4, lng: 126.8 },
    });
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
    expect(fakeMap.panTo).toHaveBeenCalledOnce();
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
    expect(screen.queryByRole('img', { name: '현재 위치' })).not.toBeInTheDocument();
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
    expect(fakeMap.panTo).toHaveBeenCalledOnce();
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
});
