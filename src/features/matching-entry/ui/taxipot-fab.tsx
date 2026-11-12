import Image from 'next/image';

import { MatchingActionButton } from './matching-action-button';

type TaxipotFabProps = {
  onClick: () => void;
};

export function TaxipotFab({ onClick }: TaxipotFabProps) {
  return (
    <MatchingActionButton
      className="!w-[137px] !max-w-[137px]"
      icon={
        <Image
          alt=""
          aria-hidden="true"
          className="absolute top-[calc(50%_+_0.5px)] left-[12.763px] block max-w-none -translate-y-1/2"
          height={18.0001}
          src="/icons/matching-entry/person2.svg"
          unoptimized
          width={22.7384}
        />
      }
      onClick={onClick}
    >
      <span className="inline-block pl-2">택시팟 찾기</span>
    </MatchingActionButton>
  );
}
