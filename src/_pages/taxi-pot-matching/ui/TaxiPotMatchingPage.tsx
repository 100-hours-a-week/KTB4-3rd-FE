'use client';

import { TaxiPotMatchingDialog } from '@/features/taxi-pot-matching';
import { useTaxiPotMatchingPageModel } from '@/_pages/taxi-pot-matching/model/use-taxi-pot-matching-page-model';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';

export function TaxiPotMatchingPage() {
  const model = useTaxiPotMatchingPageModel();

  return (
    <div
      aria-label="택시팟 매칭 중"
      className="relative mx-auto min-h-dvh w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-default)]"
    >
      <TaxiPotMatchingDialog
        canceling={model.isCanceling}
        open
        onCancel={model.onCancel}
        onConfirm={model.onConfirm}
      />
      <SnackbarViewport className="fixed inset-x-0 bottom-4 z-[2147483647] mx-auto max-w-[393px] px-5" />
    </div>
  );
}
