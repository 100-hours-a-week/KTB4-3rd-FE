'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef } from 'react';

import { Dialog } from '@/shared/ui/dialog';

type LoginRequiredDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function LoginRequiredDialog({ onOpenChange, open }: LoginRequiredDialogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginNavigationRef = useRef(false);

  const handleLoginClick = () => {
    isLoginNavigationRef.current = true;
    router.push('/login');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (nextOpen || isLoginNavigationRef.current) {
      isLoginNavigationRef.current = false;
      return;
    }

    if (pathname && pathname !== '/') {
      router.push('/');
    }
  };

  return (
    <Dialog
      buttons="primarySecondary"
      className="!w-[calc(100%-40px)] !max-w-[353px]"
      description="로그인 페이지로 이동할까요?"
      open={open}
      primaryButtonProps={{ onClick: handleLoginClick }}
      primaryLabel="로그인하러가기"
      secondaryLabel="취소"
      title="로그인이 필요해요"
      onOpenChange={handleOpenChange}
    />
  );
}
