export type LocationSearchResult = {
  id: string;
  placeName: string;
  distance: string;
  roadAddress: string;
  latitude?: number;
  longitude?: number;
  placeUrl?: string;
};

export type LocationSelection = {
  departure: LocationSearchResult;
  destination: LocationSearchResult;
};

export const defaultLocationSearchResults: LocationSearchResult[] = [
  {
    id: 'uspace-1-1',
    placeName: '유스페이스1빌딩',
    distance: '116m',
    roadAddress: '경기 성남시 분당구 대왕판교로 660',
  },
  {
    id: 'uspace-1-2',
    placeName: '유스페이스1빌딩',
    distance: '116m',
    roadAddress: '경기 성남시 분당구 대왕판교로 660',
  },
  {
    id: 'uspace-1-3',
    placeName: '유스페이스1빌딩',
    distance: '116m',
    roadAddress: '경기 성남시 분당구 대왕판교로 660',
  },
  {
    id: 'uspace-1-4',
    placeName: '유스페이스1빌딩',
    distance: '116m',
    roadAddress: '경기 성남시 분당구 대왕판교로 660',
  },
  {
    id: 'uspace-1-5',
    placeName: '유스페이스1빌딩',
    distance: '116m',
    roadAddress: '경기 성남시 분당구 대왕판교로 660',
  },
  {
    id: 'uspace-1-6',
    placeName: '유스페이스1빌딩',
    distance: '116m',
    roadAddress: '경기 성남시 분당구 대왕판교로 660',
  },
  {
    id: 'uspace-1-7',
    placeName: '유스페이스1빌딩',
    distance: '116m',
    roadAddress: '경기 성남시 분당구 대왕판교로 660',
  },
];
