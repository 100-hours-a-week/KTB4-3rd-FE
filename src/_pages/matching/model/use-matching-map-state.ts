'use client';

import { useCallback, useRef, useState } from 'react';

import type { MapCoordinate } from '@/shared/types/common';
import { DEFAULT_MAP_CENTER, type MapRef, type MapViewport } from '@/shared/ui/map';

function isSameQueryArea(left: MapViewport, right: MapViewport) {
  return (
    left.southWest.lat === right.southWest.lat &&
    left.southWest.lng === right.southWest.lng &&
    left.northEast.lat === right.northEast.lat &&
    left.northEast.lng === right.northEast.lng
  );
}

export function useMatchingMapState() {
  const mapRef = useRef<MapRef>(null);
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null);
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);

  const onViewportChange = useCallback((viewport: MapViewport, source?: string) => {
    setMapViewport((current) => {
      const shouldUpdate =
        source === 'drag' || source === 'locate' || (source === 'initial' && current === null);
      if (!shouldUpdate || (current && isSameQueryArea(current, viewport))) {
        return current;
      }
      return viewport;
    });
  }, []);

  const onUserLocationChange = useCallback((coordinate: MapCoordinate) => {
    setUserLocation((current) =>
      current?.lat === coordinate.lat && current.lng === coordinate.lng ? current : coordinate,
    );
  }, []);

  const onCurrentLocationClick = useCallback(() => {
    mapRef.current?.requestCurrentLocation();
  }, []);

  return {
    mapRef,
    mapViewport,
    userLocation,
    distanceOrigin: userLocation ?? DEFAULT_MAP_CENTER,
    isListReady: mapViewport !== null,
    onViewportChange,
    onUserLocationChange,
    onCurrentLocationClick,
  };
}
