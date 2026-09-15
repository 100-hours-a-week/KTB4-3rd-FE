'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-950">
        <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold">문제가 발생했어요</h1>
          <p className="mt-3 text-sm text-slate-600">잠시 후 다시 시도해 주세요.</p>
          <button
            className="mt-6 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => reset()}
            type="button"
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
