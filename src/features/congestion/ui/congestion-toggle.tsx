'use client';

import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export const congestionToggleValues = ['congestion', 'community'] as const;
export type CongestionToggleValue = (typeof congestionToggleValues)[number];

export type CongestionToggleProps = {
  className?: string;
  defaultValue?: CongestionToggleValue;
  onValueChange?: (value: CongestionToggleValue) => void;
  value?: CongestionToggleValue;
};

const selectedBackgroundClassNames: Record<CongestionToggleValue, string> = {
  community: 'left-0 w-[68.712px]',
  congestion: 'left-[65px] w-[67px]',
};

const optionPositionClassNames: Record<
  CongestionToggleValue,
  Record<CongestionToggleValue, string>
> = {
  community: {
    community: 'left-0 w-[68.712px]',
    congestion: 'left-[68.712px] w-[63.288px]',
  },
  congestion: {
    community: 'left-0 w-[65px]',
    congestion: 'left-[65px] w-[67px]',
  },
};

export function CongestionToggle({
  className,
  defaultValue = 'congestion',
  onValueChange,
  value,
}: CongestionToggleProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = value ?? uncontrolledValue;

  const handleValueChange = (nextValue: CongestionToggleValue) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  const renderOption = (option: CongestionToggleValue, label: string) => {
    const isSelected = selectedValue === option;

    return (
      <button
        aria-pressed={isSelected}
        className={cn(
          'absolute top-0 flex h-[34px] items-center justify-center whitespace-nowrap border-0 bg-transparent p-0 transition-[left,width] duration-200 ease-out motion-reduce:transition-none',
          optionPositionClassNames[selectedValue][option],
        )}
        onClick={() => handleValueChange(option)}
        type="button"
      >
        <Text
          as="span"
          className="transition-colors duration-200 ease-out motion-reduce:transition-none"
          color={isSelected ? 'fg.neutralInverted' : 'fg.disabled'}
          variant="t3Bold"
        >
          {label}
        </Text>
      </button>
    );
  };

  return (
    <div
      aria-label="지도 보기"
      className={cn(
        'relative h-[34px] w-[132px] overflow-hidden rounded-[30px] bg-[var(--color-bg-disabled)]',
        className,
      )}
      data-value={selectedValue}
      role="group"
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute top-0 flex h-[34px] items-center rounded-[30px] bg-[var(--color-bg-brand-solid)] transition-[left,width] duration-200 ease-out motion-reduce:transition-none',
          selectedBackgroundClassNames[selectedValue],
        )}
      />

      {renderOption('congestion', '혼잡도')}
      {renderOption('community', '커뮤니티')}
    </div>
  );
}
