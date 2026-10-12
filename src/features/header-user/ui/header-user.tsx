'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';
import type { User } from '@/entities/user';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { Menu } from '@/shared/ui/menu';

type HeaderUserProps = {
  user?: User;
};

export function HeaderUser({ user }: HeaderUserProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);

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

  const userMenuItems = [
    {
      id: 'logout',
      icon: <Icon name="logOut" size={24} />,
      content: '로그아웃',
      onClick: () => setIsLogoutDialogOpen(true),
    },
    {
      id: 'delete-account',
      icon: <Icon name="userRoundX" size={24} />,
      content: '회원 탈퇴',
      onClick: () => setIsWithdrawalDialogOpen(true),
    },
  ];

  return (
    <>
      <Menu aria-label="사용자 메뉴" items={userMenuItems}>
        <button
          aria-label="프로필 메뉴 열기"
          className="inline-flex size-[42px] items-center justify-center rounded-full p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
          data-clarity-mask="true"
          type="button"
        >
          <Avatar alt="프로필" size="md" src={user?.profile_image_url} />
        </button>
      </Menu>
      <Dialog
        buttons="primarySecondary"
        onOpenChange={setIsLogoutDialogOpen}
        open={isLogoutDialogOpen}
        primaryLabel="로그아웃하기"
        primaryVariant="neutral-solid"
        showCloseButton={false}
        title="로그아웃하시겠어요?"
      />
      <Dialog
        buttons="primarySecondary"
        description="탈퇴하더라도 작성한 글과 채팅 내역은 다른사람들에게 보여요."
        onOpenChange={setIsWithdrawalDialogOpen}
        open={isWithdrawalDialogOpen}
        primaryLabel="탈퇴하기"
        primaryVariant="critical-solid"
        showCloseButton={false}
        title="정말 탈퇴하시겠어요?"
      />
    </>
  );
}
