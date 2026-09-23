'use client';

import { useEffect } from 'react';

import { usePostDraftStore, type PostDraftState } from '@/shared/model/stores/post-draft-store';
import type { Transport } from '@/shared/types/common';
import { BackButton } from '@/shared/ui/back-button';
import {
  BottomActionButton,
  bottomActionPaddingImportantClassName,
} from '@/shared/ui/bottom-action-button';
import { Field } from '@/shared/ui/field';
import { Header } from '@/shared/ui/header';
import { InputField } from '@/shared/ui/input-field';
import { PageLayout } from '@/shared/ui/page-layout';
import { Select, type SelectOption } from '@/shared/ui/select';
import { Text } from '@/shared/ui/text';
import { Textarea } from '@/shared/ui/textarea';

export type PostWriteType = 'accompany' | 'community';

export type PostWritePageProps = {
  className?: string;
  type: PostWriteType;
};

const transportOptions: SelectOption<Transport>[] = [
  { value: 'WALK', label: '도보' },
  { value: 'PUBLIC_TRANSIT', label: '대중교통' },
  { value: 'CAR', label: '자차' },
  { value: 'BICYCLE', label: '자전거' },
];

const draftTypeByPostWriteType: Record<PostWriteType, 'COMPANION' | 'COMMUNITY'> = {
  accompany: 'COMPANION',
  community: 'COMMUNITY',
};

function setDraftTextField(
  draft: PostDraftState,
  field: 'title' | 'content' | 'origin' | 'destination' | 'departureAt',
  value: string,
) {
  if (field === 'departureAt') {
    draft.setField('departureAt', value || null);
    return;
  }

  draft.setField(field, value);
}

function CommunityPostWriteForm({ draft }: { draft: PostDraftState }) {
  return (
    <section aria-label="커뮤니티 게시글 작성" className="flex flex-col">
      <InputField
        characterCount={draft.title.length}
        label="제목"
        maxCharacterCount={30}
        maxLength={30}
        placeholder="제목을 입력해주세요"
        value={draft.title}
        onValueChange={(value) => draft.setField('title', value)}
      />
      <Field
        characterCount={draft.content.length}
        inputSlot={
          <Textarea
            aria-label="내용"
            className="[&>div]:h-[170px]"
            maxLength={500}
            placeholder="공유하고싶은 내용을 입력해주세요"
            value={draft.content}
            onValueChange={(value) => draft.setField('content', value)}
          />
        }
        label="내용"
        maxCharacterCount={500}
      />
    </section>
  );
}

function CompanionPostWriteForm({ draft }: { draft: PostDraftState }) {
  return (
    <section aria-label="동행모집 게시글 작성" className="flex flex-col gap-6">
      <InputField
        label="제목"
        maxLength={50}
        placeholder="제목을 입력해 주세요"
        required
        value={draft.title}
        onValueChange={(value) => draft.setField('title', value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="출발지"
          placeholder="출발지를 입력해 주세요"
          required
          value={draft.origin}
          onValueChange={(value) => setDraftTextField(draft, 'origin', value)}
        />
        <InputField
          label="도착지"
          placeholder="도착지를 입력해 주세요"
          required
          value={draft.destination}
          onValueChange={(value) => setDraftTextField(draft, 'destination', value)}
        />
      </div>

      <InputField
        label="출발 시간"
        required
        type="datetime-local"
        value={draft.departureAt ?? ''}
        onValueChange={(value) => setDraftTextField(draft, 'departureAt', value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="모집 인원"
          max={8}
          min={1}
          placeholder="인원"
          required
          suffixSlot="명"
          type="number"
          value={draft.capacity === null ? '' : String(draft.capacity)}
          onValueChange={(value) => {
            const nextCapacity = value === '' ? null : Number(value);
            draft.setField(
              'capacity',
              nextCapacity !== null && Number.isNaN(nextCapacity) ? null : nextCapacity,
            );
          }}
        />
        <Field
          inputSlot={
            <Select
              aria-label="교통수단"
              options={transportOptions}
              placeholder="선택해 주세요"
              required
              value={draft.transport}
              onValueChange={(value) => draft.setField('transport', value)}
            />
          }
          label="교통수단"
          required
        />
      </div>

      <Field
        inputSlot={
          <Textarea
            aria-label="내용"
            maxLength={1000}
            placeholder="동행에 필요한 내용을 입력해 주세요"
            value={draft.content}
            onValueChange={(value) => draft.setField('content', value)}
          />
        }
        label="내용"
      />
    </section>
  );
}

export function PostWritePage({ className, type }: PostWritePageProps) {
  const draft = usePostDraftStore();
  const draftType = draftTypeByPostWriteType[type];

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
          title={isCompanion ? '글 작성' : '커뮤니티'}
        />
      }
    >
      {isCompanion ? (
        <div className="flex min-h-0 flex-1 flex-col pt-8">
          <Text as="h2" color="fg.neutral" variant="t8Bold">
            동행모집 게시글 작성
          </Text>

          <div className="mt-8">
            <CompanionPostWriteForm draft={draft} />
          </div>

          <BottomActionButton className="mt-8" type="button">
            등록
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
