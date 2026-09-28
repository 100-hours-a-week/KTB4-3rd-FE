import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthCallbackPage } from '@/_pages/auth-callback/ui/AuthCallbackPage';

export const metadata: Metadata = {
  title: '인증',
};

export default function AuthCallback() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackPage />
    </Suspense>
  );
}
