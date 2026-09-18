'use client';

import { Button } from '@/shared/ui/button';
import Image from 'next/image';

export function KakaoLoginButton() {
  return (
    <Button
      size="large"
      width="fill"
      prefixIcon={
        <Image
          src="/icons/brand/kakao.svg"
          alt="카카오 로그인"
          area-hidden={true}
          width={18}
          height={18}
        />
      }
      className="!bg-[#FEE500] !text-[#000000]"
    >
      카카오 로그인
    </Button>
  );
}
