'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';
import type { User } from '@/entities/user';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { Menu } from '@/shared/ui/menu';
import { Text } from '@/shared/ui/text';

import { logout, withdrawAccount } from '../api/account-actions';

type HeaderUserProps = {
  user?: User;
};

const accountActionDialogClassName =
  '[&_[data-testid=dialog-body]]:!pt-4 [&_[data-testid=dialog-body]]:!pb-0 [&_[data-testid=dialog-footer]]:!pt-3';

function AccountActionError({ message }: { message: string | null }) {
  return (
    <div
      aria-live="polite"
      className="grid h-[38px] content-end overflow-y-auto"
      data-testid="account-action-error"
    >
      {message ? (
        <Text as="p" color="fg.critical" variant="t4Regular">
          {message}
        </Text>
      ) : null}
    </div>
  );
}

export function HeaderUser({ user }: HeaderUserProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const logoutMutation = useMutation({ mutationFn: logout });
  const withdrawalMutation = useMutation({ mutationFn: withdrawAccount });

  const finishAccountAction = () => {
    queryClient.clear();
    useAuthStore.getState().clearTokens();
    setIsLogoutDialogOpen(false);
    setIsWithdrawalDialogOpen(false);
    router.replace('/');
  };

  const handleLogout = () => {
    if (logoutMutation.isPending) {
      return;
    }
    setLogoutError(null);
    logoutMutation.mutate(undefined, {
      onSuccess: finishAccountAction,
      onError: (error) =>
        setLogoutError(error.message || '로그아웃하지 못했어요. 다시 시도해주세요.'),
    });
  };

  const handleWithdrawal = () => {
    if (withdrawalMutation.isPending) {
      return;
    }
    setWithdrawalError(null);
    withdrawalMutation.mutate(undefined, {
      onSuccess: finishAccountAction,
      onError: (error) =>
        setWithdrawalError(error.message || '탈퇴하지 못했어요. 다시 시도해주세요.'),
    });
  };

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
      onClick: () => {
        setLogoutError(null);
        setIsLogoutDialogOpen(true);
      },
    },
    {
      id: 'delete-account',
      icon: <Icon name="userRoundX" size={24} />,
      content: '회원 탈퇴',
      onClick: () => {
        setWithdrawalError(null);
        setIsWithdrawalDialogOpen(true);
      },
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
        className={accountActionDialogClassName}
        onOpenChange={(open) => {
          if (!logoutMutation.isPending) {
            setIsLogoutDialogOpen(open);
          }
        }}
        open={isLogoutDialogOpen}
        primaryButtonProps={{
          loading: logoutMutation.isPending,
          onClick: (event) => {
            event.preventDefault();
            handleLogout();
          },
        }}
        primaryLabel="로그아웃하기"
        primaryVariant="neutral-solid"
        secondaryButtonProps={{ disabled: logoutMutation.isPending }}
        showCloseButton={false}
        title="로그아웃하시겠어요?"
      >
        <AccountActionError message={logoutError} />
      </Dialog>
      <Dialog
        buttons="primarySecondary"
        className={accountActionDialogClassName}
        description="탈퇴하더라도 작성한 글과 채팅 내역은 다른사람들에게 보여요."
        onOpenChange={(open) => {
          if (!withdrawalMutation.isPending) {
            setIsWithdrawalDialogOpen(open);
          }
        }}
        open={isWithdrawalDialogOpen}
        primaryButtonProps={{
          loading: withdrawalMutation.isPending,
          onClick: (event) => {
            event.preventDefault();
            handleWithdrawal();
          },
        }}
        primaryLabel="탈퇴하기"
        primaryVariant="critical-solid"
        secondaryButtonProps={{ disabled: withdrawalMutation.isPending }}
        showCloseButton={false}
        title="정말 탈퇴하시겠어요?"
      >
        <AccountActionError message={withdrawalError} />
      </Dialog>
    </>
  );
}
