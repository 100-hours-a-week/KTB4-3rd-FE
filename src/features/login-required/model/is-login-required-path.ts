const LOGIN_REQUIRED_PATH_PREFIXES = [
  '/carpools/new',
  '/taxi-pots/new',
  '/chat',
  '/chatting',
  '/chatroom',
  '/post/create',
  '/posts/write',
] as const;

function normalizePathname(pathname: string) {
  const normalizedPathname = pathname.replace(/\/+$/, '');

  return normalizedPathname || '/';
}

export function isLoginRequiredPath(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  const normalizedPathname = normalizePathname(pathname);

  return LOGIN_REQUIRED_PATH_PREFIXES.some(
    (prefix) => normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`),
  );
}
