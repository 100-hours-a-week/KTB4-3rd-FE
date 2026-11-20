import { MyLocation } from '@/shared/ui/map';

export function MatchingMapPreview() {
  return (
    <div
      aria-label="지도 미리보기"
      className="relative h-full w-full overflow-hidden bg-[#f7f8f9]"
      role="img"
    >
      <div className="absolute top-[112px] left-[-18px] h-[204px] w-[170px] rounded-[34px] bg-[#d9f6e9]" />
      <div className="absolute top-[52px] left-[252px] h-[148px] w-[168px] rounded-[34px] bg-[#edfaf6]" />
      <div className="absolute top-[408px] left-[286px] h-[170px] w-[138px] rounded-[34px] bg-[#edfaf6]" />
      <div className="absolute top-[438px] left-0 h-[42px] w-full bg-[#e2edfc]" />
      <div className="absolute top-[242px] left-0 h-6 w-full bg-white" />
      <div className="absolute top-0 left-[187px] h-[540px] w-6 bg-white" />
      <div className="absolute top-[382px] left-5 h-[14px] w-[346px] bg-white" />
      <div className="absolute top-[148px] left-[300px] h-[342px] w-[14px] bg-white" />
      <div className="absolute top-[253px] left-0 h-px w-full bg-[#dcdee3]" />
      <div className="absolute top-0 left-[198px] h-[540px] w-px bg-[#dcdee3]" />
      <div className="absolute top-[456px] left-0 h-px w-full bg-[#aacefd]" />
      <MyLocation className="absolute top-[338px] left-[170px] !bg-[#e6f5ff] !shadow-none" />
    </div>
  );
}
