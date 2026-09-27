export const PROFILE_IMAGE_PURPOSE = 'PROFILE' as const;
export const MIN_PROFILE_IMAGE_SIZE = 1;
export const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
export const PROFILE_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png'] as const;

export type ProfileImageContentType = (typeof PROFILE_IMAGE_CONTENT_TYPES)[number];

export function isSupportedProfileImageContentType(
  contentType: string,
): contentType is ProfileImageContentType {
  return PROFILE_IMAGE_CONTENT_TYPES.includes(contentType as ProfileImageContentType);
}
