'use client';

import { useMatchingEntry } from '../model/use-matching-entry';
import { useMatchingMapState } from '../model/use-matching-map-state';
import { MatchingPageView } from './matching-page-view';
import { useCurrentUserQuery } from '@/features/user-profile';
import { Map } from '@/shared/ui/map';

export function MatchingPage() {
  const currentUserQuery = useCurrentUserQuery();
  const matchingEntry = useMatchingEntry();
  const matchingMapState = useMatchingMapState();

  return (
    <MatchingPageView
      fabContainerRef={matchingEntry.fabContainerRef}
      isFabOpened={matchingEntry.isFabOpen}
      map={
        <div
          aria-label="매칭 지도"
          className="h-full"
          data-list-ready={matchingMapState.isListReady}
          role="region"
        >
          <Map
            className="h-full"
            locateOnMount
            onUserLocationChange={matchingMapState.onUserLocationChange}
            onViewportChange={matchingMapState.onViewportChange}
            ref={matchingMapState.mapRef}
            showCurrentLocationButton={false}
            showZoomControls={false}
          />
        </div>
      }
      onCarpoolClick={matchingEntry.onCarpoolClick}
      onCurrentLocationClick={matchingMapState.onCurrentLocationClick}
      onFabOpenChange={matchingEntry.onFabOpenChange}
      onTaxipotClick={matchingEntry.onTaxipotClick}
      user={currentUserQuery.data?.data}
    />
  );
}
