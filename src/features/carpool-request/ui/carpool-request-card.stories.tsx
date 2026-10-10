import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import { CarpoolRequestCard, type CarpoolRequestCardProps } from './carpool-request-card';

const profile = (
  <>
    <Avatar alt="김춘식 프로필" size={90} />
    <Text as="span" variant="t8Bold">
      김춘식
    </Text>
  </>
);

const meta = {
  title: 'Features/CarpoolRequest/CarpoolRequestCard',
  component: CarpoolRequestCard,
  parameters: { layout: 'centered' },
  args: {
    isSubmitting: false,
    onSubmit: () => undefined,
    onDirtyChange: () => undefined,
    profileSlot: profile,
  },
  decorators: [
    (Story) => (
      <div className="w-[361px] max-w-[calc(100vw_-_32px)] bg-[var(--color-bg-layer-default)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CarpoolRequestCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { name: '입력과 길이 검증' };

function SubmissionPreview(props: CarpoolRequestCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [submittedContent, setSubmittedContent] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  return (
    <>
      <CarpoolRequestCard
        {...props}
        key={cardKey}
        isSubmitting={isSubmitting}
        onDirtyChange={setIsDirty}
        onSubmit={(content) => {
          setSubmittedContent(content);
          setFailed(false);
          setIsSubmitting(true);
        }}
      />
      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-stroke-neutral-subtle)] pt-3">
        <Button
          disabled={!isSubmitting}
          onClick={() => {
            setIsSubmitting(false);
            setFailed(true);
          }}
          size="small"
          type="button"
          variant="neutral-weak"
        >
          실패 응답 테스트
        </Button>
        <Button
          onClick={() => {
            setIsSubmitting(false);
            setSubmittedContent(null);
            setFailed(false);
            setCardKey((value) => value + 1);
          }}
          size="small"
          type="button"
          variant="neutral-weak"
        >
          새로 시작
        </Button>
      </div>
      <p aria-live="polite" className="mt-2 text-sm">
        {isSubmitting ? '제출 대기 중' : '작성 가능'} · {isDirty ? '입력 있음' : '빈 입력'}
        {failed ? ' · 전송 실패 테스트: 입력은 유지됩니다.' : ''}
      </p>
      {submittedContent === null ? null : (
        <pre className="mt-2 text-sm break-words whitespace-pre-wrap">{submittedContent}</pre>
      )}
    </>
  );
}

export const SubmissionCycle: Story = {
  name: '제출 대기·실패 유지·새로 시작',
  render: (args) => <SubmissionPreview {...args} />,
};

export const WithoutProfile: Story = {
  name: '프로필 슬롯 없음',
  args: { profileSlot: undefined },
};
