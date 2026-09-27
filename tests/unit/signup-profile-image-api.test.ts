import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { requestProfileImageUpload, uploadProfileImage } from '@/features/signup/api/profile-image';
import { server } from '@/shared/api/mocks/server';
import {
  MOCK_PROFILE_IMAGE_KEY,
  MOCK_PROFILE_UPLOAD_URL,
} from '@/shared/api/mocks/signup.handlers';

describe('signup profile image API', () => {
  it('프로필 이미지 업로드 URL 발급 요청에 파일 메타데이터를 전달한다', async () => {
    const file = new File(['profile'], 'profile.png', { type: 'image/png' });

    server.use(
      http.post('*/images/presigned-url', async ({ request }) => {
        expect(await request.json()).toEqual({
          purpose: 'PROFILE',
          content_type: 'image/png',
          content_length: file.size,
        });

        return HttpResponse.json({
          message: '이미지 업로드 URL이 발급되었습니다.',
          data: {
            upload_url: MOCK_PROFILE_UPLOAD_URL,
            image_key: MOCK_PROFILE_IMAGE_KEY,
            expires_in: 300,
          },
        });
      }),
    );

    await expect(requestProfileImageUpload(file)).resolves.toMatchObject({
      data: { image_key: MOCK_PROFILE_IMAGE_KEY },
    });
  });

  it('presigned URL에 파일을 같은 Content-Type으로 업로드한다', async () => {
    const file = new File(['profile'], 'profile.png', { type: 'image/png' });

    await expect(uploadProfileImage(MOCK_PROFILE_UPLOAD_URL, file)).resolves.toBeUndefined();
  });
});
