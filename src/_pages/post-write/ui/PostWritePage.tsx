'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import type { CompanionTransport } from '@/entities/post';
import {
  usePostCreateStore,
  type PostCreateState,
  type PostCreateTime,
} from '@/features/post-create';
import { BackButton } from '@/shared/ui/back-button';
import {
  BottomActionButton,
  bottomActionPaddingImportantClassName,
} from '@/shared/ui/bottom-action-button';
import { DateInputButton } from '@/shared/ui/date-input-button';
import { Field } from '@/shared/ui/field';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { InputField } from '@/shared/ui/input-field';
import { LocationInputButton } from '@/shared/ui/location-input-button';
import { PageLayout } from '@/shared/ui/page-layout';
import { Select, type SelectOption } from '@/shared/ui/select';
import { TimeInputButton } from '@/shared/ui/time-input-button';
import { Textarea } from '@/shared/ui/textarea';
import { Tooltip } from '@/shared/ui/tooltip';

export type PostWriteType = 'accompany' | 'community';

export type PostWritePageProps = {
  className?: string;
  type: PostWriteType;
};

const LOCATION_SEARCH_ROUTE = '/posts/write/location';

const transportOptions: SelectOption<CompanionTransport>[] = [
  { value: 'OWNED_CAR', label: '자차' },
  { value: 'TAXI', label: '택시' },
  { value: 'SUBWAY', label: '지하철' },
  { value: 'BUS', label: '버스' },
];

const capacityMaxByTransport: Record<CompanionTransport, number> = {
  BUS: 9,
  OWNED_CAR: 3,
  SUBWAY: 9,
  TAXI: 3,
};

function getCapacityOptions(transport: CompanionTransport): SelectOption<string>[] {
  const maxCapacity = capacityMaxByTransport[transport];

  return Array.from({ length: maxCapacity }, (_, index) => {
    const capacity = index + 1;

    return { value: String(capacity), label: `${capacity}명` };
  });
}

const postWriteBottomSheetProps = {
  className: 'mx-auto w-full max-w-[393px]',
};

const draftTypeByPostWriteType: Record<PostWriteType, 'COMPANION' | 'COMMUNITY'> = {
  accompany: 'COMPANION',
  community: 'COMMUNITY',
};

function toDateInputValue(value: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateDraftValue(value: Date | null) {
  if (!value) {
    return null;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function CommunityPostWriteForm({ draft }: { draft: PostCreateState }) {
  return (
    <section aria-label="커뮤니티 게시글 작성" className="flex flex-col gap-2">
      <InputField
        characterCount={draft.community.title.length}
        label="제목"
        maxCharacterCount={30}
        maxLength={30}
        placeholder="제목을 입력해주세요"
        value={draft.community.title}
        onValueChange={(value) => draft.setCommunityField('title', value)}
      />
      <Field
        characterCount={draft.community.content.length}
        inputSlot={
          <Textarea
            aria-label="내용"
            className="[&>div]:h-[170px]"
            maxLength={280}
            placeholder="공유하고싶은 내용을 입력해주세요"
            value={draft.community.content}
            onValueChange={(value) => draft.setCommunityField('content', value)}
          />
        }
        label="내용"
        maxCharacterCount={280}
      />
    </section>
  );
}

function CapacityFieldLabel() {
  return (
    <span className="inline-flex items-center gap-[var(--dimension-x1)]">
      모집 인원
      <Tooltip
        align="center"
        contentClassName="-translate-y-[6px]"
        initialDisplayDuration={0}
        message="모집 인원은 본인 제외에요"
        position="top"
      >
        <button
          aria-label="모집 인원 안내"
          className="inline-flex size-4 items-center justify-center rounded-full text-[var(--color-fg-neutral-muted)]"
          type="button"
        >
          <Icon aria-hidden="true" name="info" size={16} />
        </button>
      </Tooltip>
    </span>
  );
}

function CompanionPostWriteForm({
  draft,
  onOpenLocationSearch,
}: {
  draft: PostCreateState;
  onOpenLocationSearch: (field: 'departure' | 'destination') => void;
}) {
  return (
    <section aria-label="동행모집 게시글 작성" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field
          className="min-w-0"
          inputSlot={
            <LocationInputButton
              aria-label="출발지"
              placeholder="출발지 검색"
              value={draft.companion.origin?.name ?? null}
              onClear={() => draft.setCompanionLocation('origin', null)}
              onClick={() => onOpenLocationSearch('departure')}
            />
          }
          label="출발지"
        />
        <Field
          className="min-w-0"
          inputSlot={
            <LocationInputButton
              aria-label="목적지"
              placeholder="목적지 검색"
              value={draft.companion.destination?.name ?? null}
              onClear={() => draft.setCompanionLocation('destination', null)}
              onClick={() => onOpenLocationSearch('destination')}
            />
          }
          label="목적지"
        />
        <Field
          className="min-w-0"
          inputSlot={
            <DateInputButton
              aria-label="출발 날짜"
              bottomSheetProps={postWriteBottomSheetProps}
              placeholder="날짜 선택"
              value={toDateInputValue(draft.companion.departureDate)}
              onValueChange={(value) =>
                draft.setCompanionField('departureDate', toDateDraftValue(value))
              }
            />
          }
          label="출발 날짜"
        />
        <Field
          className="min-w-0"
          inputSlot={
            <TimeInputButton
              aria-label="출발 시간"
              bottomSheetProps={postWriteBottomSheetProps}
              placeholder="시간 선택"
              value={draft.companion.departureTime}
              onValueChange={(value) =>
                draft.setCompanionField('departureTime', value as PostCreateTime | null)
              }
            />
          }
          label="출발 시간"
        />
        <Field
          className="min-w-0"
          inputSlot={
            <Select
              aria-label="이동 수단"
              options={transportOptions}
              placeholder="이동수단을 선택해주세요"
              value={draft.companion.transportType}
              onValueChange={(value) =>
                draft.setCompanionField('transportType', value as CompanionTransport)
              }
            />
          }
          label="이동 수단"
        />
        <Field
          className="min-w-0"
          inputSlot={
            <Select
              aria-label="모집 인원"
              options={getCapacityOptions(draft.companion.transportType)}
              placeholder="인원을선택해주세요"
              value={
                draft.companion.recruitCount === null ? null : String(draft.companion.recruitCount)
              }
              onValueChange={(value) =>
                draft.setCompanionField('recruitCount', value === null ? null : Number(value))
              }
            />
          }
          label={<CapacityFieldLabel />}
        />
      </div>

      <Field
        characterCount={draft.companion.content.length}
        inputSlot={
          <Textarea
            aria-label="모집 내용"
            className="[&>div]:h-[170px]"
            maxLength={200}
            placeholder="동행 모집 글의 내용을 적어주세요."
            value={draft.companion.content}
            onValueChange={(value) => draft.setCompanionField('content', value)}
          />
        }
        label="모집 내용"
        maxCharacterCount={200}
      />
    </section>
  );
}

export function PostWritePage({ className, type }: PostWritePageProps) {
  const draft = usePostCreateStore();
  const router = useRouter();
  const draftType = draftTypeByPostWriteType[type];

  const openLocationSearch = (field: 'departure' | 'destination') => {
    router.push(`${LOCATION_SEARCH_ROUTE}?field=${field}`);
  };

  useEffect(() => {
    if (draft.type !== draftType) {
      draft.setType(draftType);
    }
  }, [draft, draftType]);

  const isCompanion = type === 'accompany';

  return (
    <PageLayout
      className={className}
      contentClassName={bottomActionPaddingImportantClassName}
      header={
        <Header
          leftSlot={<BackButton href="/post/create/type" />}
          title={isCompanion ? '동행 모집' : '커뮤니티'}
        />
      }
    >
      {isCompanion ? (
        <div className="flex min-h-0 flex-1 flex-col pt-10">
          <CompanionPostWriteForm draft={draft} onOpenLocationSearch={openLocationSearch} />

          <BottomActionButton
            className="mt-auto !bg-[var(--color-bg-brand-solid)] active:!bg-[var(--color-bg-brand-solid-pressed)]"
            type="button"
          >
            등록하기
          </BottomActionButton>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col pt-6">
          <CommunityPostWriteForm draft={draft} />

          <BottomActionButton
            className="mt-auto !bg-[var(--color-bg-brand-solid)] active:!bg-[var(--color-bg-brand-solid-pressed)]"
            type="button"
          >
            등록하기
          </BottomActionButton>
        </div>
      )}
    </PageLayout>
  );
}
