import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

export type TransferCompletionConfirmationSystemMessageProps = {
  onAcknowledge: () => void;
  className?: string;
};

/** Prompts the host to confirm that all transfers have arrived. */
export function TransferCompletionConfirmationSystemMessage({
  onAcknowledge,
  className,
}: TransferCompletionConfirmationSystemMessageProps) {
  return (
    <section
      aria-label="송금 완료 확인"
      className={cn(
        'flex w-[240px] max-w-full flex-col rounded-[12px] bg-[var(--color-bg-brand-weak)] p-4',
        className,
      )}
      data-component="transfer-completion-confirmation-system-message"
    >
      <Text as="p" className="m-0 break-words" color="fg.neutral" variant="t5Bold">
        모두의 송금이 잘 전달됐나요?
      </Text>

      <div className="-mx-1 mt-[22px] w-[calc(100%+8px)]">
        <Button
          className="h-[43px] !rounded-[10px]"
          onClick={onAcknowledge}
          size="medium"
          textVariant="t4Bold"
          variant="brand-solid"
          width="fill"
        >
          확인했어요
        </Button>
      </div>
    </section>
  );
}
