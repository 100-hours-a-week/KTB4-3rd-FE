'use client';

import type { ComponentPropsWithoutRef } from 'react';

import { BottomActionButton, bottomActionPaddingClassName } from '@/shared/ui/bottom-action-button';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export type LocationSelectionFooterProps = Omit<ComponentPropsWithoutRef<'section'>, 'children'> & {
  onRegister?: () => void;
  placeName?: string;
  roadAddress?: string;
};

export function LocationSelectionFooter({
  className,
  onRegister,
  placeName = '판교역',
  roadAddress = '경기도 성남시 분당구 판교역로 166',
  ...sectionProps
}: LocationSelectionFooterProps) {
  return (
    <section
      {...sectionProps}
      aria-label="선택한 장소"
      className={cn(
        'flex h-[232px] w-full flex-col overflow-hidden rounded-tl-[24px] rounded-tr-[24px] bg-[var(--color-bg-layer-default)] px-5 pt-6',
        bottomActionPaddingClassName,
        className,
      )}
      data-testid="location-selection-footer"
    >
      <div className="flex w-full flex-col items-start gap-[6px]">
        <Text as="h1" color="fg.neutral" variant="t6Bold">
          {placeName}
        </Text>
        <Text color="fg.neutralSubtle" variant="t4Regular">
          {roadAddress}
        </Text>
      </div>

      <BottomActionButton className="mt-auto" onClick={onRegister}>
        이 위치에 핀 등록
      </BottomActionButton>
    </section>
  );
}
