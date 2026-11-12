import Image from 'next/image';

import { MatchingActionButton } from './matching-action-button';

const CAR_FRONT_ICON_SRC = '/icons/matching-entry/car-front.svg';

export function CarpoolFab({ onClick }: { onClick: () => void }) {
  return (
    <MatchingActionButton
      className="!w-[123px] !max-w-[123px]"
      icon={
        <Image
          alt=""
          aria-hidden="true"
          className="absolute top-[calc(50%_+_0.5px)] left-[12px] block max-w-none -translate-y-1/2"
          height={28}
          src={CAR_FRONT_ICON_SRC}
          unoptimized
          width={28}
        />
      }
      onClick={onClick}
    >
      <span className="inline-block pl-[10px]">카풀 등록</span>
    </MatchingActionButton>
  );
}
