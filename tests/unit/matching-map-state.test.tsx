import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMatchingMapState } from '@/_pages/matching/model/use-matching-map-state';
import { DEFAULT_MAP_CENTER, type MapRef, type MapViewport } from '@/shared/ui/map';

const viewport: MapViewport = {
  northEast: { lat: 37.6, lng: 127.1 },
  northWest: { lat: 37.6, lng: 126.8 },
  southEast: { lat: 37.4, lng: 127.1 },
  southWest: { lat: 37.4, lng: 126.8 },
};
const nextViewport: MapViewport = {
  northEast: { lat: 37.7, lng: 127.2 },
  northWest: { lat: 37.7, lng: 126.9 },
  southEast: { lat: 37.5, lng: 127.2 },
  southWest: { lat: 37.5, lng: 126.9 },
};

afterEach(cleanup);

describe('매칭 지도 조회 조건', () => {
  it('지도 준비 전에는 목록을 준비하지 않고 서울역을 거리 기준으로 사용한다', () => {
    const { result } = renderHook(useMatchingMapState);
    expect(result.current.mapViewport).toBeNull();
    expect(result.current.userLocation).toBeNull();
    expect(result.current.isListReady).toBe(false);
    expect(result.current.distanceOrigin).toEqual({ lat: 37.5547, lng: 126.9707 });
    expect(result.current.distanceOrigin).toBe(DEFAULT_MAP_CENTER);
  });

  it('initial은 최초 조회 영역만 확보하고 이후 initial은 기존 영역을 바꾸지 않는다', () => {
    const { result } = renderHook(useMatchingMapState);
    act(() => result.current.onViewportChange(viewport, 'initial'));
    expect(result.current.mapViewport).toBe(viewport);
    expect(result.current.isListReady).toBe(true);
    act(() => result.current.onViewportChange(nextViewport, 'initial'));
    expect(result.current.mapViewport).toBe(viewport);
  });

  it('드래그만 새 조회 영역에 반영하고 늦은 initial로 되돌리지 않는다', () => {
    const { result } = renderHook(useMatchingMapState);
    act(() => result.current.onViewportChange(viewport, 'initial'));
    act(() => result.current.onViewportChange(nextViewport, 'drag'));
    act(() => result.current.onViewportChange(viewport, 'initial'));
    expect(result.current.mapViewport).toBe(nextViewport);
  });

  it.each(['zoom', 'selection', 'programmatic', undefined, 'unknown'])(
    '%s 이동은 준비 전이나 준비 후의 조회 영역을 변경하지 않는다',
    (source) => {
      const { result } = renderHook(useMatchingMapState);
      act(() => result.current.onViewportChange(nextViewport, source));
      expect(result.current.mapViewport).toBeNull();
      act(() => result.current.onViewportChange(viewport, 'initial'));
      act(() => result.current.onViewportChange(nextViewport, source));
      expect(result.current.mapViewport).toBe(viewport);
    },
  );

  it('동일한 드래그 범위는 기존 조회 영역 객체를 유지한다', () => {
    const { result } = renderHook(useMatchingMapState);
    act(() => result.current.onViewportChange(viewport, 'initial'));
    act(() => result.current.onViewportChange(structuredClone(viewport), 'drag'));
    expect(result.current.mapViewport).toBe(viewport);
  });

  it.each(['southWest', 'northEast'] as const)('%s 좌표가 바뀐 드래그는 반영한다', (corner) => {
    const { result } = renderHook(useMatchingMapState);
    act(() => result.current.onViewportChange(viewport, 'initial'));
    const changed = {
      ...viewport,
      [corner]: { ...viewport[corner], lng: viewport[corner].lng + 0.01 },
    };
    act(() => result.current.onViewportChange(changed, 'drag'));
    expect(result.current.mapViewport).toBe(changed);
  });

  it('현재 위치 이동은 거리 기준만 바꾸고 지도 조회 영역은 유지한다', () => {
    const { result } = renderHook(useMatchingMapState);
    act(() => result.current.onViewportChange(viewport, 'initial'));
    const coordinate = { lat: 37.51, lng: 127.02 };
    act(() => result.current.onUserLocationChange(coordinate));
    act(() => result.current.onViewportChange(nextViewport, 'locate'));
    expect(result.current.userLocation).toBe(coordinate);
    expect(result.current.distanceOrigin).toBe(coordinate);
    expect(result.current.mapViewport).toBe(viewport);
    act(() => result.current.onUserLocationChange({ ...coordinate }));
    expect(result.current.userLocation).toBe(coordinate);
  });

  it('최초 위치 이동은 조회 영역을 만들지 않고 최초 지도 영역을 기다린다', () => {
    const { result } = renderHook(useMatchingMapState);
    act(() => result.current.onViewportChange(nextViewport, 'locate'));
    expect(result.current.mapViewport).toBeNull();
    act(() => result.current.onViewportChange(viewport, 'initial'));
    expect(result.current.mapViewport).toBe(viewport);
  });

  it('지도 준비 전 위치 성공도 조회 영역 없이 목록을 활성화하지 않는다', () => {
    const { result } = renderHook(useMatchingMapState);
    act(() => result.current.onUserLocationChange({ lat: 37.51, lng: 127.02 }));
    expect(result.current.mapViewport).toBeNull();
    expect(result.current.isListReady).toBe(false);
  });

  it('현재 위치 버튼은 지도 준비 전에도 안전하고 준비 후 Map에 위임한다', () => {
    const { result } = renderHook(useMatchingMapState);
    expect(() => act(() => result.current.onCurrentLocationClick())).not.toThrow();
    const map: MapRef = {
      requestCurrentLocation: vi.fn<() => void>(),
      requestLocationPermission: vi.fn<() => void>(),
    };
    act(() => {
      result.current.mapRef.current = map;
    });
    act(() => result.current.onCurrentLocationClick());
    expect(map.requestCurrentLocation).toHaveBeenCalledOnce();
    expect(map.requestLocationPermission).not.toHaveBeenCalled();
  });
});
