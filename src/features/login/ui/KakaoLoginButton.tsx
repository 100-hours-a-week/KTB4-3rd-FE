'use client';

import { Button } from '@/shared/ui/button';
import Image from 'next/image';

import { useKakaoLogin } from '@/features/login/model/use-kakao-login';
import { cn } from '@/shared/lib/cn';

export type KakaoLoginButtonProps = {
  className?: string;
};

export function KakaoLoginButton({ className }: KakaoLoginButtonProps) {
  const handleKakaoLogin = useKakaoLogin();

  return (
    <Button
      size="large"
      width="fill"
      type="button"
      onClick={handleKakaoLogin}
      prefixIcon={
        <Image
          src="/icons/brand/kakao.svg"
          alt="카카오 로그인"
          area-hidden="true"
          width={18}
          height={18}
        />
      }
      className={cn('!bg-[#FEE500] !text-[#000000]', className)}
    >
      카카오 로그인
    </Button>
  );
}
