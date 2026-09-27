import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';

import type { TaxiPotRideAction } from '@/features/taxi-pot-chat/model/taxi-pot-chat';

export type TaxiPotRideActionProps = {
  action: TaxiPotRideAction;
  loading?: boolean;
  onConfirm: () => void;
};

export function TaxiPotRideActionNotice({
  action,
  loading = false,
  onConfirm,
}: TaxiPotRideActionProps) {
  return (
    <div
      className={cn(
        'mt-4 flex w-[240px] max-w-full flex-col gap-4 rounded-[12px] bg-[var(--color-bg-brand-weak)] p-4',
      )}
      data-component="taxi-pot-ride-action"
      data-testid="taxi-pot-ride-action"
    >
      <Text as="p" className="m-0 break-words" color="fg.neutral" variant="t5Bold">
        운행이 시작됐나요?
      </Text>
      <div className="-mx-1 w-[calc(100%+8px)]">
        <Button
          className="h-[44px] !rounded-[10px]"
          disabled={loading}
          loading={loading}
          onClick={onConfirm}
          size="medium"
          variant="brand-solid"
          width="fill"
        >
          확인
        </Button>
      </div>
    </div>
  );
}
