'use client';

import Image from 'next/image';
import { useEffect, useId, useRef } from 'react';

import { cn } from '@/shared/lib/cn';
import { Fab } from '@/shared/ui/fab';

import { CarpoolFab } from './carpool-fab';
import { TaxipotFab } from './taxipot-fab';

const PLUS_ICON_SRC = '/icons/matching-entry/plus.svg';

export type MatchingFabProps = {
  isOpened: boolean;
  onOpenChange: (isOpened: boolean) => void;
  onCarpoolClick: () => void;
  onTaxipotClick: () => void;
  className?: string;
};

export function MatchingFab({
  isOpened,
  onOpenChange,
  onCarpoolClick,
  onTaxipotClick,
  className,
}: MatchingFabProps) {
  const menuId = `matching-fab-menu-${useId()}`;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpened) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        onOpenChange(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpened, onOpenChange]);

  return (
    <div ref={rootRef} className={cn('flex flex-col items-end', className)}>
      <div
        aria-label="매칭 등록 메뉴"
        className={cn('mb-2 flex flex-col items-end gap-3', !isOpened && 'hidden')}
        id={menuId}
        role="group"
      >
        {isOpened ? (
          <>
            <CarpoolFab
              onClick={() => {
                onOpenChange(false);
                onCarpoolClick();
              }}
            />
            <TaxipotFab
              onClick={() => {
                onOpenChange(false);
                onTaxipotClick();
              }}
            />
          </>
        ) : null}
      </div>

      <Fab
        aria-controls={menuId}
        aria-expanded={isOpened}
        aria-label={isOpened ? '매칭 메뉴 닫기' : '매칭 메뉴 열기'}
        className="relative [&&]:!h-[60px] [&&]:!max-h-[60px] [&&]:!min-h-[60px] [&&]:!w-[60px] [&&]:!max-w-[60px] [&&]:!min-w-[60px] [&&]:!gap-0 [&&]:!px-0 [&&]:!py-0"
        leftSlot={
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Image
              alt=""
              aria-hidden="true"
              className={cn(
                'block max-w-none transition-[rotate] duration-200 ease-out motion-reduce:transition-none',
                isOpened ? '-rotate-45' : 'rotate-0',
              )}
              height={33.6}
              src={PLUS_ICON_SRC}
              unoptimized
              width={36.129}
            />
          </span>
        }
        type="button"
        onClick={() => onOpenChange(!isOpened)}
      >
        <span className="sr-only">매칭 메뉴</span>
      </Fab>
    </div>
  );
}
