import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

import {
  isSupportedProfileImageContentType,
  MAX_PROFILE_IMAGE_SIZE,
  MIN_PROFILE_IMAGE_SIZE,
  PROFILE_IMAGE_PURPOSE,
} from '@/features/signup/model/profile-image';

export type ProfileImageUploadData = {
  upload_url: string;
  image_key: string;
  expires_in: number;
};

export async function requestProfileImageUpload(file: File) {
  if (!isSupportedProfileImageContentType(file.type)) {
    throw new Error('프로필 이미지는 JPEG 또는 PNG 형식만 업로드할 수 있어요.');
  }

  if (file.size < MIN_PROFILE_IMAGE_SIZE || file.size > MAX_PROFILE_IMAGE_SIZE) {
    throw new Error('프로필 이미지는 5MB 이하로 선택해주세요.');
  }

  return apiFetch<ApiResponse<ProfileImageUploadData>>('/images/presigned-url', {
    method: 'POST',
    body: JSON.stringify({
      purpose: PROFILE_IMAGE_PURPOSE,
      content_type: file.type,
      content_length: file.size,
    }),
  });
}

export async function uploadProfileImage(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    credentials: 'omit',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('프로필 이미지 업로드에 실패했어요.');
  }
}
