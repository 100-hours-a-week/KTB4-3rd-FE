import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Dialog, type DialogButtonProps, type DialogProps } from '@/shared/ui/dialog';
import { Text } from '@/shared/ui/text';

const MAX_RATING = 5;
const RATING_STARS_SRC = '/icons/rating-stars.svg';

export type ChatSatisfactionParticipant = {
  id: string;
  name: string;
};

export type ChatSatisfactionDialogSubmitPayload = {
  ratings: Record<string, number>;
};

export type ChatSatisfactionDialogSubmitButtonProps = Omit<DialogButtonProps, 'onClick'>;

export type ChatSatisfactionDialogProps = Omit<
  DialogProps,
  | 'buttons'
  | 'children'
  | 'description'
  | 'primaryButtonProps'
  | 'primaryLabel'
  | 'secondaryButtonProps'
  | 'secondaryLabel'
  | 'showCloseButton'
  | 'title'
> & {
  participants?: readonly ChatSatisfactionParticipant[];
  onReport?: (participant: ChatSatisfactionParticipant) => void;
  onSubmit?: (payload: ChatSatisfactionDialogSubmitPayload) => void;
  submitButtonProps?: ChatSatisfactionDialogSubmitButtonProps;
};

const defaultParticipants: readonly ChatSatisfactionParticipant[] = [
  { id: 'participant-1', name: '김oo' },
  { id: 'participant-2', name: '이xx' },
  { id: 'participant-3', name: '이xx' },
];

function createInitialRatings(participants: readonly ChatSatisfactionParticipant[]) {
  return Object.fromEntries(participants.map((participant) => [participant.id, MAX_RATING]));
}

function RatingStars({
  name,
  rating,
  onChange,
}: {
  name: string;
  rating: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div aria-label={`${name} 만족도`} className="relative h-12 w-[240px]" role="radiogroup">
      <Image
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full opacity-25 grayscale"
        height={48}
        src={RATING_STARS_SRC}
        width={240}
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${(rating / MAX_RATING) * 100}%` }}
      >
        <Image
          alt=""
          className="block h-12 w-[240px] max-w-none"
          height={48}
          src={RATING_STARS_SRC}
          width={240}
        />
      </div>
      <div className="absolute inset-0 flex">
        {Array.from({ length: MAX_RATING }, (_, index) => {
          const value = index + 1;

          return (
            <button
              key={value}
              aria-checked={rating === value}
              aria-label={`${name} ${value}점`}
              className="h-12 w-12 rounded focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]"
              onClick={() => onChange(value)}
              role="radio"
              type="button"
            />
          );
        })}
      </div>
    </div>
  );
}

function ParticipantRatingRow({
  onRatingChange,
  onReport,
  participant,
  rating,
}: {
  onRatingChange: (rating: number) => void;
  onReport?: (participant: ChatSatisfactionParticipant) => void;
  participant: ChatSatisfactionParticipant;
  rating: number;
}) {
  return (
    <div className="flex h-[75px] w-[260px] flex-col">
      <div className="flex h-[22px] w-full items-start justify-between">
        <Text as="span" color="fg.neutral" variant="t5Regular">
          {participant.name}
        </Text>
        <button
          aria-label={`${participant.name} 신고하기`}
          className="mt-0.5 shrink-0 p-0"
          onClick={() => onReport?.(participant)}
          type="button"
        >
          <Text as="span" color="fg.neutralMuted" variant="t1Bold">
            신고하기 &gt;
          </Text>
        </button>
      </div>
      <RatingStars name={participant.name} onChange={onRatingChange} rating={rating} />
    </div>
  );
}

export function ChatSatisfactionDialog({
  className,
  onReport,
  onSubmit,
  participants = defaultParticipants,
  submitButtonProps,
  ...props
}: ChatSatisfactionDialogProps) {
  const [ratings, setRatings] = useState(() => createInitialRatings(participants));

  return (
    <Dialog
      {...props}
      buttons="primary"
      className={cn(
        '!max-h-none !w-[calc(100%-40px)] !max-w-[353px]',
        '[&>div:has([data-testid=dialog-body])]:!flex-none [&>div:has([data-testid=dialog-body])]:!overflow-visible',
        '[&_[data-testid=dialog-body]]:!flex-none [&_[data-testid=dialog-body]]:!h-[303px] [&_[data-testid=dialog-body]]:!min-h-[303px] [&_[data-testid=dialog-body]]:!overflow-visible [&_[data-testid=dialog-body]]:!px-[22px] [&_[data-testid=dialog-body]]:!py-0',
        '[&_[data-testid=dialog-footer]]:!pb-5 [&_[data-testid=dialog-footer]]:!pt-5',
        className,
      )}
      primaryButtonProps={{
        ...submitButtonProps,
        className: cn(
          '!rounded-[8px] !bg-[var(--color-bg-neutral-inverted)] !text-[var(--color-fg-neutral-inverted)] active:!bg-[var(--color-bg-neutral-inverted-pressed)]',
          submitButtonProps?.className,
        ),
        onClick: () => onSubmit?.({ ratings }),
      }}
      primaryLabel="확인"
      showCloseButton={false}
      description="동승자에 대한 만족도를 입력해주세요."
      title="만족도를 입력해주세요."
    >
      <div className="h-[303px] w-full pt-5">
        <div className="flex h-[283px] w-full flex-col items-center justify-center gap-3 overflow-hidden">
          {participants.map((participant) => (
            <ParticipantRatingRow
              key={participant.id}
              onRatingChange={(rating) =>
                setRatings((currentRatings) => ({
                  ...currentRatings,
                  [participant.id]: rating,
                }))
              }
              onReport={onReport}
              participant={participant}
              rating={ratings[participant.id] ?? MAX_RATING}
            />
          ))}
        </div>
      </div>
    </Dialog>
  );
}
