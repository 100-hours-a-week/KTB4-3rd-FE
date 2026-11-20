export type MatchingLocationField = 'departure' | 'destination';

export function getMatchingLocationLabel(field: MatchingLocationField) {
  return field === 'departure' ? '출발지' : '도착지';
}

export function getMatchingLocationActionLabel(field: MatchingLocationField) {
  return field === 'departure' ? '출발' : '도착';
}

export function getMatchingLocationPanelActionLabel(field: MatchingLocationField) {
  return field === 'departure' ? '출발지로 설정' : '도착지로 설정';
}
