'use client';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

type BaseProps = {
  bankAccount: string;
  onBankAccountClick: (bankAccount: string) => void;
  perPersonAmount: number;
  className?: string;
};

export type TaxiPotSettlementRequestSystemMessageProps =
  | (BaseProps & { role: 'host' })
  | (BaseProps & {
      role: 'passenger';
      totalAmount: number;
      onViewMeterPhoto: () => void;
    });

function WonAmount({ amount }: { amount: number }) {
  return <>{amount}원</>;
}

/** Shows the settlement request message tailored to the host or a passenger. */
export function TaxiPotSettlementRequestSystemMessage(
  props: TaxiPotSettlementRequestSystemMessageProps,
) {
  const { bankAccount, className, perPersonAmount, role } = props;

  return (
    <section
      aria-label={role === 'passenger' ? '방장의 정산 요청' : '동승자 정산 요청'}
      className={cn(
        'flex w-[240px] max-w-full flex-col rounded-[12px] bg-[var(--color-bg-brand-weak)] p-4',
        className,
      )}
      data-component="taxi-pot-settlement-request-system-message"
      data-role={role}
    >
      <Text as="p" className="m-0 break-words" color="fg.neutral" variant="t5Bold">
        {role === 'passenger' ? '방장이 정산을 요청했어요' : '동승자에게 정산을 요청했어요'}
      </Text>

      {role === 'passenger' ? (
        <div className="mt-3 flex flex-col">
          <Text as="p" className="m-0" color="fg.neutral" variant="t5Regular">
            총 금액 <WonAmount amount={props.totalAmount} />
          </Text>
          <Text as="p" className="m-0" color="fg.neutral" variant="t5Regular">
            인당{' '}
            <strong className="font-bold">
              <WonAmount amount={perPersonAmount} />
            </strong>
          </Text>
        </div>
      ) : null}

      <div className={role === 'passenger' ? 'mt-3' : 'mt-2'}>
        <button
          aria-label={`${bankAccount} 복사`}
          className="block w-fit cursor-pointer appearance-none border-0 bg-transparent p-0 text-left"
          onClick={() => props.onBankAccountClick(bankAccount)}
          type="button"
        >
          <Text
            as="span"
            className="break-words decoration-[var(--color-fg-brand)] underline-offset-2"
            color="fg.neutral"
            textDecorationLine="underline"
            variant="t4Regular"
          >
            {bankAccount}
          </Text>
        </button>
      </div>

      {role === 'passenger' ? (
        <Button
          className="mt-6 h-[43px] !rounded-[10px]"
          onClick={props.onViewMeterPhoto}
          size="medium"
          textVariant="t4Bold"
          variant="neutral-solid"
          width="fill"
        >
          미터기 사진 보기
        </Button>
      ) : (
        <div className="mt-5">
          <Text as="p" className="m-0" color="fg.neutral" variant="t5Regular">
            인당{' '}
            <strong className="font-bold">
              <WonAmount amount={perPersonAmount} />
            </strong>
          </Text>
        </div>
      )}
    </section>
  );
}
