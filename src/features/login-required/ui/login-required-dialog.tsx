'use client';

import { useRouter } from 'next/navigation';

import { Dialog } from '@/shared/ui/dialog';

type LoginRequiredDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function LoginRequiredDialog({ onOpenChange, open }: LoginRequiredDialogProps) {
  const router = useRouter();

  return (
    <Dialog
      buttons="primarySecondary"
      className="!w-[calc(100%-40px)] !max-w-[353px]"
      description="로그인 페이지로 이동할까요?"
      open={open}
      primaryButtonProps={{ onClick: () => router.push('/login') }}
      primaryLabel="로그인하러가기"
      secondaryLabel="취소"
      title="로그인이 필요해요"
      onOpenChange={onOpenChange}
    />
  );
}
