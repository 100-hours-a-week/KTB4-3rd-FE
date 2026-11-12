import type { CarpoolLocationField } from '@/features/carpool-registration';

export function getCarpoolLocationLabel(field: CarpoolLocationField) {
  return field === 'departure' ? '출발지' : '도착지';
}

export function getCarpoolLocationActionLabel(field: CarpoolLocationField) {
  return field === 'departure' ? '출발' : '도착';
}

export function getCarpoolLocationConfirmLabel(field: CarpoolLocationField) {
  return field === 'departure' ? '출발지로 설정' : '도착지로 설정';
}

export function parseCarpoolLocationField(value: string | null) {
  return value === 'departure' || value === 'destination' ? value : null;
}
