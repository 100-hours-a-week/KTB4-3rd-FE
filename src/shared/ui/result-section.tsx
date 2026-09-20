import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button, type ButtonProps, type ButtonVariant } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Text, type TextVariant } from '@/shared/ui/text';

export type ResultSectionSize = 'large' | 'medium';
export type ResultSectionButtons = 'none' | 'primary' | 'primarySecondary';

type ResultSectionButtonProps = Omit<
  ButtonProps,
  'children' | 'className' | 'size' | 'variant' | 'width'
> & {
  className?: string;
};

type ResultSectionOwnProps = {
  buttons?: ResultSectionButtons;
  description?: string;
  icon?: ReactNode;
  primaryButtonProps?: ResultSectionButtonProps;
  primaryLabel?: ReactNode;
  secondaryButtonProps?: ResultSectionButtonProps;
  secondaryLabel?: ReactNode;
  size?: ResultSectionSize;
  title?: string;
};

export type ResultSectionProps = ResultSectionOwnProps &
  Omit<ComponentPropsWithoutRef<'section'>, keyof ResultSectionOwnProps>;

const DEFAULT_TITLE = '상태 안내 타이틀';
const DEFAULT_DESCRIPTION =
  '상태에 대한 부가 설명이 필요한 경우 적어주세요.\n최대 두 줄을 권장해요.';

const sizeStyles: Record<
  ResultSectionSize,
  {
    description: TextVariant;
    descriptionMargin: string;
    inner: string;
    outer: string;
    title: TextVariant;
    titleMargin: string;
    buttonMargin: string;
  }
> = {
  large: {
    description: 't5Regular',
    descriptionMargin: '!mt-[8px]',
    inner: 'h-[350px]',
    outer: 'h-[420px]',
    title: 't10Bold',
    titleMargin: '!mt-[22px]',
    buttonMargin: 'mt-[12px]',
  },
  medium: {
    description: 't4Regular',
    descriptionMargin: '!mt-[8px]',
    inner: 'h-[280px]',
    outer: 'h-[350px]',
    title: 't8Bold',
    titleMargin: '!mt-[22px]',
    buttonMargin: 'mt-[12px]',
  },
};

const primaryButtonVariants: Record<'single' | 'paired', ButtonVariant> = {
  single: 'ghost',
  paired: 'neutral-solid',
};

function ResultSectionIcon({ icon }: { icon?: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="flex size-[72px] shrink-0 items-center justify-center"
      data-testid="result-section-icon"
    >
      {icon ?? <Icon name="checkmarkCircle" size={60} color="var(--color-fg-positive)" />}
    </div>
  );
}

function ResultSectionButton({
  label,
  variant,
  className,
  ...props
}: ResultSectionButtonProps & { label: ReactNode; variant: ButtonVariant }) {
  return (
    <Button
      {...props}
      className={cn('h-[44px] min-h-[44px] rounded-[12px] px-0 py-0', className)}
      size="medium"
      variant={variant}
      width="fill"
    >
      {label}
    </Button>
  );
}

export function ResultSection({
  buttons = 'none',
  className,
  description = DEFAULT_DESCRIPTION,
  icon,
  primaryButtonProps,
  primaryLabel = '라벨',
  secondaryButtonProps,
  secondaryLabel = '보조',
  size = 'large',
  title = DEFAULT_TITLE,
  ...sectionProps
}: ResultSectionProps) {
  const styles = sizeStyles[size];
  const hasPrimary = buttons !== 'none';
  const hasSecondary = buttons === 'primarySecondary';
  const primaryVariant = hasSecondary ? primaryButtonVariants.paired : primaryButtonVariants.single;

  return (
    <section {...sectionProps} className={cn('w-full max-w-[520px]', styles.outer, className)}>
      <div
        className={cn(
          'mx-auto flex w-[calc(100%-32px)] max-w-[420px] flex-col items-center overflow-clip rounded-[18px] pt-[26px]',
          styles.inner,
        )}
      >
        <ResultSectionIcon icon={icon} />

        <Text
          as="h2"
          align="center"
          className={cn('block w-full max-w-[364px] break-words', styles.titleMargin)}
          variant={styles.title}
        >
          {title}
        </Text>

        <Text
          align="center"
          className={cn('block w-full max-w-[348px] break-words', styles.descriptionMargin)}
          maxLines={2}
          variant={styles.description}
          whiteSpace="pre-line"
          color="fg.neutralSubtle"
        >
          {description}
        </Text>

        {hasPrimary ? (
          <div
            className={cn(
              'flex shrink-0',
              hasSecondary ? 'w-[224px] gap-[32px]' : 'w-[104px]',
              styles.buttonMargin,
            )}
          >
            {hasSecondary ? (
              <div className="w-[96px]">
                <ResultSectionButton
                  {...secondaryButtonProps}
                  className={cn(
                    'bg-[var(--color-bg-neutral-weak)]',
                    secondaryButtonProps?.className,
                  )}
                  label={secondaryLabel}
                  variant="neutral-weak"
                />
              </div>
            ) : null}
            <div className={hasSecondary ? 'w-[96px]' : 'w-[104px]'}>
              <ResultSectionButton
                {...primaryButtonProps}
                className={cn(
                  !hasSecondary &&
                    'bg-[var(--color-bg-transparent-selected)] active:!bg-[var(--color-bg-transparent-selected-pressed)]',
                  hasSecondary && 'bg-[var(--color-bg-neutral-inverted)]',
                  primaryButtonProps?.className,
                )}
                label={primaryLabel}
                variant={primaryVariant}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
