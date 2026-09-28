'use client';

import { useRouter } from 'next/navigation';

import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';
import type { User } from '@/entities/user';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Menu } from '@/shared/ui/menu';

type HeaderUserProps = {
  user?: User;
};

const userMenuItems = [
  {
    id: 'edit-profile',
    icon: <Icon name="info" size={24} />,
    content: '정보수정하기',
  },
  {
    id: 'logout',
    icon: <Icon name="logOut" size={24} />,
    content: '로그아웃',
  },
  {
    id: 'delete-account',
    icon: <Icon name="userRoundX" size={24} />,
    content: '회원 탈퇴',
  },
];

export function HeaderUser({ user }: HeaderUserProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  if (!isAuthenticated) {
    return (
      <Button
        aria-label="로그인하기"
        size="small"
        variant="brand-solid"
        onClick={() => router.push('/login')}
      >
        로그인하기
      </Button>
    );
  }

  return (
    <Menu aria-label="사용자 메뉴" disabled items={userMenuItems}>
      <button
        aria-label="프로필 메뉴 열기"
        className="inline-flex size-[42px] items-center justify-center rounded-full p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
        type="button"
      >
        <Avatar alt="프로필" size="md" src={user?.profile_image_url} />
      </button>
    </Menu>
  );
}
