'use client';

import { Field as BaseField } from '@base-ui/react/field';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { Field } from '@/shared/ui/field';
import { Textarea } from '@/shared/ui/textarea';

export type CarpoolRequestSubmitActionProps = {
  disabled: boolean;
  loading: boolean;
  type: 'submit';
};

export type CarpoolRequestCardProps = {
  isSubmitting: boolean;
  onSubmit: (content: string) => void;
  onDirtyChange: (isDirty: boolean) => void;
  profileSlot?: ReactNode;
  renderSubmitAction?: (props: CarpoolRequestSubmitActionProps) => ReactNode;
};

const MAX_CONTENT_LENGTH = 200;

export function CarpoolRequestCard({
  isSubmitting,
  onSubmit,
  onDirtyChange,
  profileSlot,
  renderSubmitAction,
}: CarpoolRequestCardProps) {
  const [content, setContent] = useState('');
  const lastNotifiedDirty = useRef<boolean | undefined>(undefined);
  const characterCount = content.length;
  const isDirty = characterCount > 0;
  const isOverLimit = characterCount > MAX_CONTENT_LENGTH;
  const isContentValid = characterCount >= 1 && !isOverLimit;
  const isSubmitDisabled = isSubmitting || !isContentValid;

  useEffect(() => {
    if (lastNotifiedDirty.current === isDirty) {
      return;
    }
    lastNotifiedDirty.current = isDirty;
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || content.length < 1 || content.length > MAX_CONTENT_LENGTH) {
      return;
    }
    onSubmit(content);
  };

  const submitActionProps: CarpoolRequestSubmitActionProps = {
    disabled: isSubmitDisabled,
    loading: isSubmitting,
    type: 'submit',
  };

  return (
    <form
      aria-label="카풀 요청"
      className="mx-auto flex min-h-[436px] w-[calc(100%_-_48px)] max-w-[312px] flex-col pb-[13px]"
      noValidate
      onSubmit={handleSubmit}
    >
      {profileSlot ? (
        <>
          <div className="flex flex-col items-center gap-2">{profileSlot}</div>
          <Divider className="mt-[10px]" color="var(--color-stroke-neutral-weak)" />
        </>
      ) : null}
      <div className={profileSlot ? 'mt-3' : undefined}>
        <Field
          characterCount={characterCount}
          characterCountShowFrom={180}
          disabled={isSubmitting}
          errorMessage={isOverLimit ? '200자 이내로 입력해주세요' : undefined}
          inputSlot={
            <BaseField.Control
              onValueChange={setContent}
              render={
                <Textarea
                  autoSize={false}
                  onValueChange={setContent}
                  placeholder="함께 타고 싶은 이유를 알려주세요"
                  textareaClassName="h-full"
                  value={content}
                />
              }
              value={content}
            />
          }
          invalid={isOverLimit}
          label="요청 메시지"
          maxCharacterCount={MAX_CONTENT_LENGTH}
          required
        />
      </div>
      <div className="mt-auto pt-3">
        {renderSubmitAction ? (
          renderSubmitAction(submitActionProps)
        ) : (
          <Button
            {...submitActionProps}
            className="!h-11 !min-h-11 !rounded-[22px]"
            variant="brand-solid"
            width="fill"
          >
            전송하기
          </Button>
        )}
      </div>
    </form>
  );
}
