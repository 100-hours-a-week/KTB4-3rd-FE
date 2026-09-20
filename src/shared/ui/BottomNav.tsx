'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/lib/cn';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type BottomNavProps = {
  className?: string;
};

type BottomNavItem = {
  key: 'matching' | 'home' | 'chatting';
  label: string;
  href: string;
  inactiveIcon: IconName;
  activeIcon: IconName;
};

const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  {
    key: 'matching',
    label: '매칭',
    href: '/matching',
    inactiveIcon: 'person2Line',
    activeIcon: 'person2Fill',
  },
  {
    key: 'home',
    label: '홈',
    href: '/',
    inactiveIcon: 'houseLine',
    activeIcon: 'houseFill',
  },
  {
    key: 'chatting',
    label: '채팅',
    href: '/chatting',
    inactiveIcon: 'chatbubbleLine',
    activeIcon: 'chatbubbleFill',
  },
];

function normalizePathname(pathname: string | null) {
  const normalizedPathname = pathname?.replace(/\/+$/, '');

  return normalizedPathname || '/';
}

function isActivePathname(pathname: string | null, href: string) {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedHref = normalizePathname(href);

  if (normalizedHref === '/') {
    return normalizedPathname === '/';
  }

  return (
    normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`)
  );
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[calc(72px+env(safe-area-inset-bottom))] w-full max-w-[393px] border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-layer-default)] pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      <ul className="flex h-[72px] w-full">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = isActivePathname(pathname, item.href);

          return (
            <li className="min-w-0 flex-1" key={item.key}>
              <Link
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-full w-full flex-col items-center gap-[var(--dimension-x2)] pt-[9px] text-center transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]',
                  isActive
                    ? 'text-[var(--color-fg-brand)]'
                    : 'text-[var(--color-fg-neutral-muted)]',
                )}
                data-nav-item={item.key}
                href={item.href}
              >
                <Icon
                  color="currentColor"
                  name={isActive ? item.activeIcon : item.inactiveIcon}
                  size={24}
                />
                <Text
                  color={isActive ? 'fg.brand' : 'fg.neutralMuted'}
                  variant={isActive ? 't1Bold' : 't1Regular'}
                >
                  {item.label}
                </Text>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
