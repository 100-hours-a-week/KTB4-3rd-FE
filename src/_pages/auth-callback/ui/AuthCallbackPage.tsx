'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/shared/ui/button';
import { PageLayout } from '@/shared/ui/page-layout';
import { Text } from '@/shared/ui/text';
import { VStack } from '@/shared/ui/stack';

const SIGNUP_REQUIRED_STATUS = 'signup_required';
const SUCCESS_STATUS = 'ok';

export function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    if (status === SIGNUP_REQUIRED_STATUS) {
      router.replace('/signup');
    }
  }, [router, status]);

  if (status === SUCCESS_STATUS) {
    return (
      <PageLayout>
        <VStack className="flex-1" align="center" justify="center">
          <Text as="h1" variant="t4Bold" color="fg.neutral">
            로그인되었습니다
          </Text>
        </VStack>
      </PageLayout>
    );
  }

  if (status === SIGNUP_REQUIRED_STATUS) {
    return null;
  }

  return (
    <PageLayout>
      <VStack className="flex-1" align="center" justify="center">
        <Text as="h1" variant="t4Bold" color="fg.critical" align="center">
          {errorDescription ?? '카카오 로그인에 실패했습니다'}
        </Text>
        <Button type="button" width="fill" onClick={() => router.replace('/login')}>
          로그인으로 돌아가기
        </Button>
      </VStack>
    </PageLayout>
  );
}
