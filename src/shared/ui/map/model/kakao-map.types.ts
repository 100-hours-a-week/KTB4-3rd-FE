export type KakaoLatLng = {
  getLat: () => number;
  getLng: () => number;
};

export type KakaoLatLngBounds = {
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
};

export type KakaoMap = {
  getBounds: () => KakaoLatLngBounds;
  getCenter: () => KakaoLatLng;
  getLevel: () => number;
  getProjection: () => KakaoMapProjection;
  panTo: (position: KakaoLatLng) => void;
  relayout: () => void;
  setCenter: (position: KakaoLatLng) => void;
  setLevel: (level: number, options?: { anchor?: KakaoLatLng; animate?: boolean }) => void;
};

export type KakaoMapProjection = {
  containerPointFromCoords: (position: KakaoLatLng) => KakaoPoint;
  coordsFromContainerPoint: (point: KakaoPoint) => KakaoLatLng;
};

export type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void;
};

export type KakaoCluster = {
  getCenter: () => KakaoLatLng;
};

export type KakaoMarkerClusterer = {
  addMarkers: (markers: KakaoMarker[]) => void;
  clear: () => void;
  setMap: (map: KakaoMap | null) => void;
};

export type KakaoMarkerClustererStyle = Record<string, string | number>;

export type KakaoAddress = {
  address_name: string;
  building_name?: string;
};

export type KakaoAddressResult = {
  address?: KakaoAddress | null;
  road_address?: KakaoAddress | null;
};

export type KakaoGeocoder = {
  coord2Address: (
    x: number,
    y: number,
    callback: (result: KakaoAddressResult[], status: string) => void,
  ) => void;
};

export type KakaoPlace = {
  address_name: string;
  category_group_code?: string;
  category_name?: string;
  distance?: string;
  id: string;
  place_name: string;
  place_url?: string;
  phone?: string;
  road_address_name?: string;
  x: string;
  y: string;
};

export type KakaoPlaceSearchOptions = {
  category_group_code?: string;
  page?: number;
  radius?: number;
  size?: number;
  sort?: 'accuracy' | 'distance';
  x?: string;
  y?: string;
};

export type KakaoPlaces = {
  keywordSearch: (
    keyword: string,
    callback: (data: KakaoPlace[], status: string) => void,
    options?: KakaoPlaceSearchOptions,
  ) => void;
};

export type KakaoServicesApi = {
  Geocoder: new () => KakaoGeocoder;
  Places: new () => KakaoPlaces;
  Status: {
    ERROR?: string;
    OK: string;
    RESULT_NOT_FOUND?: string;
    ZERO_RESULT?: string;
  };
};

export type KakaoMapEvent = {
  addListener(
    target: object,
    eventName: 'clusterclick',
    handler: (cluster: KakaoCluster) => void,
  ): void;
  addListener(target: object, eventName: 'idle', handler: () => void): void;
  addListener(target: object, eventName: 'bounds_changed', handler: () => void): void;
  addListener(target: object, eventName: 'click', handler: () => void): void;
  removeListener(target: object, eventName: 'idle', handler: () => void): void;
  removeListener(target: object, eventName: 'bounds_changed', handler: () => void): void;
  removeListener(target: object, eventName: 'click', handler: () => void): void;
};

export type KakaoMapsApi = {
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  Marker: new (options: {
    image?: KakaoMarkerImage;
    position: KakaoLatLng;
    title?: string;
  }) => KakaoMarker;
  MarkerClusterer: new (options: {
    averageCenter: boolean;
    disableClickZoom: boolean;
    map: KakaoMap;
    minLevel: number;
    styles?: KakaoMarkerClustererStyle[];
  }) => KakaoMarkerClusterer;
  MarkerImage: new (
    src: string,
    size: KakaoSize,
    options: { offset: KakaoPoint },
  ) => KakaoMarkerImage;
  Point: new (x: number, y: number) => KakaoPoint;
  Size: new (width: number, height: number) => KakaoSize;
  event: KakaoMapEvent;
  load: (callback: () => void) => void;
  services?: KakaoServicesApi;
};

export type KakaoMarkerImage = object;
export type KakaoPoint = {
  x: number;
  y: number;
};
export type KakaoSize = object;

export type KakaoNamespace = {
  maps: KakaoMapsApi;
};
