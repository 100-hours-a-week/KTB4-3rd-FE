import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export type CongestionLegendItem = {
  color: string;
  label: string;
  range: string;
};

const defaultCongestionLegendItems: readonly CongestionLegendItem[] = [
  {
    label: '원활·여유',
    range: '대기 없음',
    color: '#CCE9FF',
  },
  {
    label: '혼잡',
    range: '줄 서서 대기',
    color: '#FBDC65',
  },
  {
    label: '붐빔·만석',
    range: '탑승 실패·통제',
    color: '#FA342C',
  },
  {
    label: '지연',
    range: '제보 기반',
    color: '#FA9D2C',
  },
  {
    label: '사고',
    range: '제보 기반',
    color: '#111111',
  },
] as const;

export type CongestionLegendProps = HTMLAttributes<HTMLDivElement> & {
  heading?: string;
  items?: readonly CongestionLegendItem[];
};

export function CongestionLegend({
  className,
  heading = '범례',
  items = defaultCongestionLegendItems,
  ...props
}: CongestionLegendProps) {
  return (
    <div
      aria-label="혼잡도 범례"
      className={cn(
        'box-border h-[150px] w-[168px] rounded-[8px] bg-[rgba(255,255,255,0.7)] px-3 py-[10px] pr-[10px]',
        className,
      )}
      data-congestion-legend
      role="group"
      {...props}
    >
      <div className="flex flex-col gap-2">
        <Text as="h2" color="fg.neutral" fontSize="t2" fontWeight="bold" lineHeight="t3">
          {heading}
        </Text>

        <div className="flex flex-col gap-[7px]">
          {items.map(({ color, label, range }) => (
            <div className="flex h-[15px] items-center" key={label}>
              <div className="flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="block size-3 shrink-0 rounded-full"
                  data-congestion-legend-marker
                  style={{ backgroundColor: color }}
                />
                <Text
                  className="w-[60px] whitespace-nowrap"
                  color="fg.neutral"
                  fontSize="t1"
                  lineHeight="t1"
                  whiteSpace="nowrap"
                >
                  {label}
                </Text>
              </div>
              <Text
                align="right"
                className="ml-auto w-[70px] whitespace-nowrap"
                color="fg.neutralSubtle"
                fontSize="t1"
                lineHeight="t1"
                whiteSpace="nowrap"
              >
                {range}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
