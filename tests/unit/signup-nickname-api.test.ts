import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { checkNicknameAvailability } from '@/features/signup/api/nickname';
import { server } from '@/shared/api/mocks/server';

describe('nickname availability API', () => {
  it('닉네임 중복확인 요청에 닉네임을 query로 전달한다', async () => {
    server.use(
      http.get('*/users/nickname-availability', ({ request }) => {
        expect(new URL(request.url).searchParams.get('nickname')).toBe('제리');

        return HttpResponse.json({
          message: '사용할 수 있는 닉네임이에요',
          data: { available: true },
        });
      }),
    );

    await expect(checkNicknameAvailability('제리')).resolves.toMatchObject({
      data: { available: true },
    });
  });
});
