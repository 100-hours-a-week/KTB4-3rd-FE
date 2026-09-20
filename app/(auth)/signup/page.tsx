import { Suspense } from 'react';

import { SignupPage } from '@/_pages/signup/ui/SignupPage';

export default function Signup() {
  return (
    <Suspense fallback={null}>
      <SignupPage />
    </Suspense>
  );
}
