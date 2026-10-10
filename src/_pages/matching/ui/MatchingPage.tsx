'use client';

import { useMatchingEntry } from '../model/use-matching-entry';
import { useMatchingMapState } from '../model/use-matching-map-state';
import { MatchingPageView } from './matching-page-view';
import { useCurrentUserQuery } from '@/features/user-profile';
import { Map } from '@/shared/ui/map';

export function MatchingPage() {
  const currentUserQuery = useCurrentUserQuery();
  const { fabContainerRef, isFabOpen, onCarpoolClick, onFabOpenChange, onTaxipotClick } =
    useMatchingEntry();
  const { isListReady, mapRef, onCurrentLocationClick, onUserLocationChange, onViewportChange } =
    useMatchingMapState();

  return (
    <MatchingPageView
      fabContainerRef={fabContainerRef}
      isFabOpened={isFabOpen}
      map={
        <div aria-label="매칭 지도" className="h-full" data-list-ready={isListReady} role="region">
          <Map
            className="h-full"
            locateOnMount
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
      onTaxipotClick={onTaxipotClick}
      user={currentUserQuery.data?.data}
    />
  );
}
