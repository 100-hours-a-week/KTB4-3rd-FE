'use client';

import { type MouseEvent, useState } from 'react';

import { CongestionPin, type CongestionPinProps } from '@/entities/congestion';

export type CongestionPinSelectProps = Omit<CongestionPinProps, 'isSelected'> & {
  defaultSelected?: boolean;
  onSelectedChange?: (isSelected: boolean) => void;
};

export function CongestionPinSelect({
  defaultSelected = false,
  onClick,
  onSelectedChange,
  ...props
}: CongestionPinSelectProps) {
  const [isSelected, setIsSelected] = useState(defaultSelected);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const nextSelected = !isSelected;

    setIsSelected(nextSelected);
    onSelectedChange?.(nextSelected);
    onClick?.(event);
  };

  return <CongestionPin {...props} isSelected={isSelected} onClick={handleClick} />;
}
