import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SignupPage } from '@/_pages/signup/ui/SignupPage';

export const metadata: Metadata = {
  title: '회원가입',
};

export default function Signup() {
  return (
    <Suspense fallback={null}>
      <SignupPage />
    </Suspense>
  );
}
