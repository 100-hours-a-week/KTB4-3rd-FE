import { describe, expect, it } from 'vitest';

import {
  getCarpoolRequestAvailability,
  type CarpoolRequestAvailabilityInput,
} from '@/entities/carpool';

const nowTimestamp = Date.parse('2026-10-11T03:00:00.000Z');
const eligibleInput: CarpoolRequestAvailabilityInput = {
  status: 'RECRUITING',
  isHost: false,
  isParticipant: false,
  isCheckingRequest: false,
  isFull: false,
  departureTimestamp: nowTimestamp + 60_000,
  nowTimestamp,
};

describe('getCarpoolRequestAvailability', () => {
  it.each([
    ['host before participant', { isHost: true, isParticipant: true }, 'host'],
    [
      'participant before request status',
      { isParticipant: true, myRequestStatus: 'PENDING' },
      'participant',
    ],
    ['pending before accepted', { myRequestStatus: 'PENDING' }, 'pending-request'],
    [
      'accepted before closed carpool',
      { myRequestStatus: 'ACCEPTED', status: 'CANCELED' },
      'accepted-request',
    ],
    ['canceled before completed', { status: 'CANCELED' }, 'canceled'],
    ['completed before in progress', { status: 'COMPLETED' }, 'completed'],
    [
      'in progress before departure',
      { status: 'IN_PROGRESS', departureTimestamp: nowTimestamp },
      'in-progress',
    ],
    [
      'departure before full',
      { departureTimestamp: nowTimestamp, isFull: true },
      'departure-passed',
    ],
    ['full after departure', { isFull: true }, 'full'],
  ] as const)('uses the spec priority: %s', (_name, overrides, reason) => {
    expect(getCarpoolRequestAvailability({ ...eligibleInput, ...overrides })).toMatchObject({
      state: 'disabled',
      canRequest: false,
      reason,
    });
  });

  it.each(['REJECTED', 'EXPIRED'] as const)(
    'allows a request after a %s request when every blocking condition is clear',
    (myRequestStatus) => {
      expect(getCarpoolRequestAvailability({ ...eligibleInput, myRequestStatus })).toMatchObject({
        state: 'available',
        canRequest: true,
        reason: null,
        message: null,
      });
    },
  );

  it('blocks unknown carpool states instead of treating them as recruiting', () => {
    expect(getCarpoolRequestAvailability({ ...eligibleInput, status: 'ARCHIVED' })).toMatchObject({
      state: 'disabled',
      reason: 'invalid-status',
    });
  });

  it.each([null, Number.NaN, Number.POSITIVE_INFINITY])(
    'blocks an invalid departure timestamp (%s)',
    (departureTimestamp) => {
      expect(getCarpoolRequestAvailability({ ...eligibleInput, departureTimestamp })).toMatchObject(
        { state: 'disabled', reason: 'invalid-departure-time' },
      );
    },
  );

  it('treats departure at the current instant as passed', () => {
    expect(
      getCarpoolRequestAvailability({ ...eligibleInput, departureTimestamp: nowTimestamp }),
    ).toMatchObject({ state: 'disabled', reason: 'departure-passed' });
  });

  it('shows checking status instead of a warning while verifying fresh details', () => {
    expect(
      getCarpoolRequestAvailability({
        ...eligibleInput,
        isCheckingRequest: true,
        isHost: true,
      }),
    ).toMatchObject({ state: 'checking', canRequest: false, reason: null });
  });
});
