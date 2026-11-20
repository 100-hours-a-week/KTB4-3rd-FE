import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

type SettlementImagePurpose = 'METER' | 'TRANSFER';

type PresignedImageUpload = {
  upload_url: string;
  image_key: string;
  expires_in: number;
};

const MAX_IMAGE_SIZE = 5_242_880;

async function compressSettlementImage(file: File): Promise<File> {
  if (file.size <= MAX_IMAGE_SIZE) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('사진을 압축하지 못했어요.');
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const quality = Math.max(0.45, 0.86 - attempt * 0.06);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality),
      );
      if (blob && blob.size <= MAX_IMAGE_SIZE) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
          type: 'image/jpeg',
          lastModified: file.lastModified,
        });
      }
      scale *= 0.82;
    }
  } finally {
    bitmap.close();
  }

  throw new Error('사진 용량을 5MB 이하로 줄이지 못했어요.');
}

export async function uploadSettlementImage(
  accessToken: string,
  purpose: SettlementImagePurpose,
  file: File,
): Promise<string> {
  const image = await compressSettlementImage(file);
  if (!['image/jpeg', 'image/png'].includes(image.type)) {
    throw new Error('JPEG 또는 PNG 이미지를 선택해주세요.');
  }
  if (image.size < 1 || image.size > MAX_IMAGE_SIZE) {
    throw new Error('이미지는 5MB 이하로 선택해주세요.');
  }

  const { data } = await apiFetch<ApiResponse<PresignedImageUpload>>('/images/presigned-url', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify({ purpose, content_type: image.type, content_length: image.size }),
  });
  const response = await fetch(data.upload_url, {
    method: 'PUT',
    credentials: 'omit',
    headers: { 'Content-Type': image.type },
    body: image,
  });
  if (!response.ok) {
    throw new Error('사진 업로드에 실패했어요.');
  }
  return data.image_key;
}
