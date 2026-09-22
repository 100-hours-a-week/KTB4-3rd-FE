import { Button, type ButtonProps } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';

export const bottomActionPaddingClassName =
  'pb-[calc(var(--spacing-y-screen-bottom)+env(safe-area-inset-bottom,0px))]';
export const bottomActionPaddingImportantClassName =
  '!pb-[calc(var(--spacing-y-screen-bottom)+env(safe-area-inset-bottom,0px))]';

const bottomActionButtonClassName =
  'h-[52px] min-h-[52px] !rounded-[8px] !bg-[#414650] !px-4 !py-3';

export type BottomActionButtonProps = Omit<
  ButtonProps,
  'size' | 'textVariant' | 'variant' | 'width'
>;

export function BottomActionButton({ className, ...props }: BottomActionButtonProps) {
  return (
    <Button
      {...props}
      className={cn(bottomActionButtonClassName, className)}
      size="large"
      textVariant="t5Bold"
      variant="neutral-solid"
      width="fill"
    />
  );
}
