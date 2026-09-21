import { Suspense } from 'react';

import { AuthCallbackPage } from '@/_pages/auth-callback/ui/AuthCallbackPage';

export default function AuthCallback() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackPage />
    </Suspense>
  );
}
