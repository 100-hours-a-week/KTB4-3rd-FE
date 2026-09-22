import type { CompanionTransport } from '@/entities/post/model/post';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

const transportLabels: Record<CompanionTransport, string> = {
  BUS: '버스',
  CAR: '자차',
  SUBWAY: '지하철',
  TAXI: '택시',
};

export type TransportTagProps = {
  className?: string;
  transport: CompanionTransport;
};

export function TransportTag({ className, transport }: TransportTagProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full bg-[var(--color-bg-neutral-weak)] px-3 py-1',
        className,
      )}
    >
      <Text color="fg.brand" variant="t3Bold">
        {transportLabels[transport]}
      </Text>
    </span>
  );
}
