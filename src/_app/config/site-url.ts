export function getSiteUrl() {
  const configuredUrl = process.env.SITE_URL ?? 'https://moyeota.com';

  try {
    const url = new URL(configuredUrl);

    if (
      (url.protocol !== 'https:' && url.protocol !== 'http:') ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}
