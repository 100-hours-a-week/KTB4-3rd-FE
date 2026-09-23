'use client';

import { useId, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

const DEFAULT_TITLE = '📢 [안내] 택시 탑승 전, 꼭 읽어주세요';
const ANNOUNCEMENT_CONTENT = [
  '안전한 동승을 위해 확인해주세요',
  '',
  '• 밝고 사람이 많은 장소에서 만나주세요.',
  '• 출발 시간과 정산 방법을 미리 합의해주세요.',
  '• 집 주소 등 민감한 개인정보 공유는 피해주세요.',
  '• 불편하거나 위험하다고 느껴지면 언제든 참여를 취소해주세요.',
  '• 문제가 발생하면 신고 기능을 이용해주세요.',
  '',
  '출발 이후부터 모든사람이 정산 완료할때까지 방을 나갈 수 없습니다.',
].join('\n');

export type AnnouncementDropdownProps = {
  departureTime: string;
  title?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
};

export function AnnouncementDropdown({
  departureTime,
  title = DEFAULT_TITLE,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  className,
}: AnnouncementDropdownProps) {
  const contentId = `announcement-dropdown-content-${useId()}`;
  const isControlled = expanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = isControlled ? expanded : internalExpanded;

  const handleToggle = () => {
    const nextExpanded = !isExpanded;

    if (!isControlled) {
      setInternalExpanded(nextExpanded);
    }

    onExpandedChange?.(nextExpanded);
  };

  return (
    <section
      className={cn(
        'flex h-[68px] w-full flex-col overflow-hidden rounded-[12px] bg-[var(--color-bg-layer-default)] shadow-[0_0_10px_rgba(0,0,0,0.15)] transition-[height] duration-200 ease-out',
        'data-[state=expanded]:h-[262px]',
        className,
      )}
      data-state={isExpanded ? 'expanded' : 'collapsed'}
    >
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        aria-label={`안내 ${isExpanded ? '접기' : '펼치기'}`}
        className="flex h-[68px] shrink-0 appearance-none items-center gap-4 border-0 bg-transparent px-4 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]"
        onClick={handleToggle}
        type="button"
      >
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <Text as="span" className="truncate" color="fg.neutral" variant="t2Bold">
            {title}
          </Text>
          <Text as="span" color="fg.neutralSubtle" variant="t1Regular">
            출발 시간: {departureTime}
          </Text>
        </span>
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-[var(--color-fg-neutral-muted)]">
          <Icon
            aria-hidden="true"
            className="transition-transform duration-200 ease-out"
            name="chevronDown"
            size="100%"
            style={{ transform: isExpanded ? 'rotate(180deg)' : undefined }}
          />
        </span>
      </button>

      {isExpanded ? (
        <div
          aria-label="안내 내용"
          className="min-h-0 flex-1 px-[15px] pt-2 pb-8"
          id={contentId}
          role="region"
        >
          <Text as="p" color="fg.neutral" variant="t2Regular" whiteSpace="pre-line">
            {ANNOUNCEMENT_CONTENT}
          </Text>
        </div>
      ) : null}
    </section>
  );
}
