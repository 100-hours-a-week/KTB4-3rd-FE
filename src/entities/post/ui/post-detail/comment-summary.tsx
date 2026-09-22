import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

export type CommentSummaryProps = {
  className?: string;
  count: number;
};

export function CommentSummary({ className, count }: CommentSummaryProps) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Icon
        aria-hidden="true"
        color="var(--color-fg-neutral-muted)"
        name="messageSquare"
        size={16}
      />
      <Text color="fg.neutralMuted" variant="t3Regular">
        {count}
      </Text>
    </span>
  );
}
