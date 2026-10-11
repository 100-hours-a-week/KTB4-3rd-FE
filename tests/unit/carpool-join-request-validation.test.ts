import { describe, expect, it } from 'vitest';

import { isJoinRequestContentValid } from '@/features/carpool-join-request';

describe('isJoinRequestContentValid', () => {
  it.each([
    { content: '', expected: false },
    { content: '가', expected: true },
    { content: '가'.repeat(200), expected: true },
    { content: '가'.repeat(201), expected: false },
    { content: '😀'.repeat(100), expected: true },
    { content: '😀'.repeat(101), expected: false },
  ])('UTF-16 길이 입력의 유효성을 $expected로 판정한다', ({ content, expected }) => {
    expect(isJoinRequestContentValid(content)).toBe(expected);
  });
});
