export const PROFILE_IMAGE_HOSTNAMES = [
  'moyeota-dev-images.s3.ap-northeast-2.amazonaws.com',
  'moyeota-prod-images.s3.ap-northeast-2.amazonaws.com',
] as const;

export function canOptimizeProfileImage(src: string) {
  try {
    const url = new URL(src);
    return (
      url.protocol === 'https:' &&
      url.port === '' &&
      PROFILE_IMAGE_HOSTNAMES.some((hostname) => hostname === url.hostname)
    );
  } catch {
    return false;
  }
}
