import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

export type TransferCompletionSystemMessageProps = {
  nickname: string;
  amount: number;
  onViewReceipt?: () => void;
  className?: string;
};

/** Shows that a passenger completed their transfer and lets the host inspect the receipt. */
export function TransferCompletionSystemMessage({
  nickname,
  amount,
  onViewReceipt,
  className,
}: TransferCompletionSystemMessageProps) {
  return (
    <section
      aria-label={`${nickname}님의 송금 완료`}
      className={cn(
        'flex w-[240px] max-w-full flex-col rounded-[12px] bg-[var(--color-bg-brand-weak)] p-4',
        className,
      )}
      data-component="transfer-completion-system-message"
    >
      <Text as="p" className="m-0 break-words" color="fg.neutral" variant="t5Bold">
        {nickname}님이 송금을 완료했어요!
      </Text>

      <div className="mt-4">
        <Text as="p" className="mb-0" color="fg.neutral" variant="t5Regular">
          금액 <strong className="font-bold">{amount}원</strong>
        </Text>
      </div>

      <div className="-mx-1 mt-3 w-[calc(100%+8px)]">
        <Button
          className="h-[43px] !rounded-[10px]"
          onClick={onViewReceipt}
          disabled={!onViewReceipt}
          size="medium"
          textVariant="t4Bold"
          variant="neutral-solid"
          width="fill"
        >
          인증사진 보기
        </Button>
      </div>
    </section>
  );
}
