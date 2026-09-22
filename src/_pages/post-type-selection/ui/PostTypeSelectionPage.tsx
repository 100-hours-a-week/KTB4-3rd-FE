'use client';

import { useCallback } from 'react';

import { MapPin } from '@/entities/map-pin';
import type { PostType } from '@/entities/post';
import { usePostDraftStore } from '@/shared/model/stores/post-draft-store';
import { BackButton } from '@/shared/ui/back-button';
import {
  BottomActionButton,
  bottomActionPaddingImportantClassName,
} from '@/shared/ui/bottom-action-button';
import { Divider } from '@/shared/ui/divider';
import { Header } from '@/shared/ui/header';
import { PageLayout } from '@/shared/ui/page-layout';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';

const postTypeOptions = [
  {
    type: 'COMPANION',
    title: '동행 모집',
    description: '같이 갈 사람을 찾아요',
    pinVariant: 'accompany',
  },
  {
    type: 'COMMUNITY',
    title: '커뮤니티 글',
    description: '정보·후기를 공유해요',
    pinVariant: 'community',
  },
] as const satisfies readonly {
  type: PostType;
  title: string;
  description: string;
  pinVariant: 'accompany' | 'community';
}[];

export type PostTypeSelectionPageProps = {
  backHref?: string;
  className?: string;
  onNext?: (type: PostType) => void;
  placeName?: string;
};

type PostTypeOptionCardProps = {
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  pinVariant: 'accompany' | 'community';
  title: string;
};

function PostTypeOptionCard({
  description,
  isSelected,
  onSelect,
  pinVariant,
  title,
}: PostTypeOptionCardProps) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        'flex h-[134px] w-full items-center gap-3 rounded-[16px] border px-[19px] text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]',
        isSelected
          ? 'border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-neutral-weak-pressed)]'
          : 'border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-layer-default)]',
      )}
      type="button"
      onClick={onSelect}
    >
      <MapPin aria-hidden="true" className="!scale-100" variant={pinVariant} />
      <span className="flex flex-col gap-2 overflow-hidden whitespace-nowrap">
        <Text as="span" color="fg.neutral" variant="t6Bold">
          {title}
        </Text>
        <Text as="span" color="fg.neutralMuted" variant="t4Regular">
          {description}
        </Text>
      </span>
    </button>
  );
}

export function PostTypeSelectionPage({
  backHref = '/',
  className,
  onNext,
  placeName = '판교역',
}: PostTypeSelectionPageProps) {
  const draftType = usePostDraftStore((state) => state.type);
  const setType = usePostDraftStore((state) => state.setType);
  const selectedType = draftType ?? 'COMMUNITY';

  const handleSelect = useCallback(
    (type: PostType) => {
      setType(type);
    },
    [setType],
  );

  const handleNext = useCallback(() => {
    setType(selectedType);
    onNext?.(selectedType);
  }, [onNext, selectedType, setType]);

  return (
    <PageLayout
      className={className}
      contentClassName={bottomActionPaddingImportantClassName}
      header={<Header leftSlot={<BackButton href={backHref} />} />}
    >
      <div className="flex min-h-0 flex-1 flex-col pt-[43px]">
        <section aria-labelledby="post-type-selection-title">
          <Text
            as="h1"
            className="block"
            color="fg.neutral"
            id="post-type-selection-title"
            variant="t8Bold"
          >
            어떤 글을 등록할까요?
          </Text>
          <div className="mt-[2px] ml-px">
            <Text as="p" color="fg.neutralMuted" variant="t5Regular">
              글의 목적에 맞는 유형을 선택해 주세요.
            </Text>
          </div>
        </section>

        <div className="mt-[39px] flex flex-col gap-9">
          {postTypeOptions.map((option) => (
            <PostTypeOptionCard
              description={option.description}
              isSelected={selectedType === option.type}
              key={option.type}
              pinVariant={option.pinVariant}
              title={option.title}
              onSelect={() => handleSelect(option.type)}
            />
          ))}
        </div>

        <section
          aria-label="선택한 위치"
          className="mt-auto h-12 w-full rounded-[var(--dimension-x3)]"
        >
          <Divider className="w-full" color="var(--color-stroke-neutral-weak)" />
          <div className="flex h-full items-start justify-between pt-5">
            <Text color="fg.neutral" variant="t5Regular">
              선택 위치
            </Text>
            <Text color="fg.neutral" variant="t6Bold">
              {placeName}
            </Text>
          </div>
        </section>

        <BottomActionButton className="mt-[67px]" type="button" onClick={handleNext}>
          다음
        </BottomActionButton>
      </div>
    </PageLayout>
  );
}
