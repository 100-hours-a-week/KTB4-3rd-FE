export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export type MapCoordinate = {
  lat: number;
  lng: number;
};

export type UserSummary = {
  id: string;
  nickname: string;
  profileImageUrl?: string | null;
};

export type LocationPermissionStatus =
  | 'prompt'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable';

export type Transport = 'OWNED_CAR' | 'TAXI' | 'SUBWAY' | 'BUS';
