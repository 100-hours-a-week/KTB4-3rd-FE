'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

export type TaxiMeterPhotoRequestProps = {
  onSend: (file: File) => void;
  onManualEntry?: () => void;
  onRegisterPhotoPicker?: (openPicker: (() => void) | null) => void;
  remainingAttempts?: number;
  sending?: boolean;
  className?: string;
};

export type TaxiMeterPhotoConfirmationProps = {
  previewUrl: string;
  onBack: () => void;
  onRetake: () => void;
  onSend: () => void;
  sending?: boolean;
  photoAlt?: string;
  screenLabel?: string;
  retakeLabel?: string;
};

/** The photo confirmation screen is shown after the native picker returns an image. */
export function TaxiMeterPhotoConfirmation({
  previewUrl,
  onBack,
  onRetake,
  onSend,
  sending = false,
  photoAlt = '선택한 택시 미터기 사진',
  screenLabel = '미터기 사진 확인 화면',
  retakeLabel = '재촬영',
}: TaxiMeterPhotoConfirmationProps) {
  const [pendingAction, setPendingAction] = useState<'back' | 'retake' | null>(null);

  useEffect(() => {
    if (!pendingAction) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Backspace') {
        event.preventDefault();
        setPendingAction(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingAction]);

  function confirmExit() {
    const action = pendingAction;
    setPendingAction(null);

    if (action === 'back') {
      onBack();
    } else if (action === 'retake') {
      onRetake();
    }
  }

  return (
    <>
      <section
        aria-label={screenLabel}
        className="fixed inset-y-0 left-1/2 z-30 flex w-full max-w-[393px] -translate-x-1/2 flex-col bg-[var(--color-bg-layer-default)]"
      >
        <Header
          leftSlot={
            <button
              aria-label="사진 확인 닫기"
              className="inline-flex size-11 items-center justify-center"
              onClick={() => setPendingAction('back')}
              type="button"
            >
              <Icon name="chevronLeft" size={24} />
            </button>
          }
          title="사진 확인"
        />
        <div className="relative mx-5 mt-[72px] min-h-0 flex-1">
          <Image
            alt={photoAlt}
            className="object-contain"
            fill
            sizes="(max-width: 393px) calc(100vw - 40px), 353px"
            src={previewUrl}
            unoptimized
          />
        </div>
        <div className="flex flex-col gap-2 px-5 pt-4 pb-[calc(40px+env(safe-area-inset-bottom,0px))]">
          <Button
            className="h-[52px] !rounded-[8px]"
            loading={sending}
            onClick={onSend}
            size="large"
            variant="brand-solid"
            width="fill"
          >
            전송
          </Button>
          <Button
            className="h-[52px] !rounded-[8px]"
            disabled={sending}
            onClick={() => setPendingAction('retake')}
            size="large"
            variant="neutral-weak"
            width="fill"
          >
            {retakeLabel}
          </Button>
        </div>
      </section>
      <Dialog
        buttons="primarySecondary"
        className={cn(
          '!h-[256px] !w-[333px] !max-w-[calc(100%-40px)] !shadow-none',
          '[&_[data-testid=dialog-header]]:!px-6 [&_[data-testid=dialog-header]]:!pt-7',
          '[&_[data-testid=dialog-header]_p]:!mt-4',
          '[&_[data-testid=dialog-footer]]:!absolute [&_[data-testid=dialog-footer]]:!right-6 [&_[data-testid=dialog-footer]]:!bottom-[19px] [&_[data-testid=dialog-footer]]:!left-6 [&_[data-testid=dialog-footer]]:!flex-col [&_[data-testid=dialog-footer]]:!gap-[6px] [&_[data-testid=dialog-footer]]:!p-0',
        )}
        description={
          <>
            이 페이지를 나가면 이미지가 사라져요.
            <br />
            그래도 나가시겠어요?
          </>
        }
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        open={pendingAction !== null}
        primaryButtonProps={{
          className:
            '!h-[46px] !min-h-[46px] !rounded-[8px] [&>span]:!text-[var(--font-size-t5)] [&>span]:!leading-[var(--line-height-t5)]',
          onClick: confirmExit,
        }}
        primaryLabel="나갈게요"
        primaryVariant="critical-solid"
        secondaryButtonProps={{
          className:
            '!h-[46px] !min-h-[46px] !rounded-[8px] [&>span]:!text-[var(--font-size-t5)] [&>span]:!leading-[var(--line-height-t5)]',
          onClick: () => setPendingAction(null),
        }}
        secondaryLabel="취소"
        showCloseButton={false}
        title="정말 나가시겠어요?"
      />
    </>
  );
}

/** A settlement system message that opens the device image picker and previews its result. */
export function TaxiMeterPhotoRequest({
  onSend,
  onManualEntry,
  onRegisterPhotoPicker,
  remainingAttempts,
  sending = false,
  className,
}: TaxiMeterPhotoRequestProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [photo, setPhoto] = useState<{ file: File; previewUrl: string } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const openPhotoPicker = useCallback(() => {
    if (!inputRef.current || sending) {
      return;
    }

    // The native value must be cleared to allow selecting the same image again.
    inputRef.current.value = '';
    inputRef.current.click();
  }, [sending]);

  useEffect(() => {
    onRegisterPhotoPicker?.(openPhotoPicker);
    return () => onRegisterPhotoPicker?.(null);
  }, [onRegisterPhotoPicker, openPhotoPicker]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file || !['image/jpeg', 'image/png'].includes(file.type)) {
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setPhoto({ file, previewUrl });
  }

  const closeConfirmation = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPhoto(null);
  }, []);

  function retakePhoto() {
    closeConfirmation();
    openPhotoPicker();
  }

  return (
    <>
      <div
        className={cn(
          'flex w-[240px] max-w-full flex-col gap-4 rounded-[12px] bg-[var(--color-bg-brand-weak)] p-4',
          className,
        )}
        data-component="taxi-meter-photo-request"
      >
        <Text as="p" className="m-0 break-words" color="fg.neutral" variant="t5Bold">
          미터기 사진을 보내주세요
        </Text>
        <div className="-mx-1 w-[calc(100%+8px)]">
          {remainingAttempts === 0 ? (
            <Button
              className="h-[44px] !rounded-[10px]"
              onClick={onManualEntry}
              size="medium"
              variant="brand-solid"
              width="fill"
            >
              수동 입력하기
            </Button>
          ) : (
            <Button
              className="h-[44px] !rounded-[10px]"
              onClick={openPhotoPicker}
              size="medium"
              variant="brand-solid"
              width="fill"
            >
              확인
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        accept="image/jpeg,image/png"
        aria-label="택시 미터기 사진 선택"
        className="sr-only"
        onChange={handlePhotoChange}
        type="file"
      />
      {photo ? (
        <TaxiMeterPhotoConfirmation
          onBack={closeConfirmation}
          onRetake={retakePhoto}
          onSend={() => onSend(photo.file)}
          previewUrl={photo.previewUrl}
          sending={sending}
        />
      ) : null}
    </>
  );
}

export type TransferPhotoRequestProps = {
  settlementId: number;
  onSend: (file: File) => void;
  onRegisterPhotoPicker?: (settlementId: number, openPicker: (() => void) | null) => void;
  sending?: boolean;
  disabled?: boolean;
  className?: string;
};

/** A passenger settlement message that opens the native image picker and previews the selected transfer proof. */
export function TransferPhotoRequest({
  settlementId,
  onSend,
  onRegisterPhotoPicker,
  sending = false,
  disabled = false,
  className,
}: TransferPhotoRequestProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [photo, setPhoto] = useState<{ file: File; previewUrl: string } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const openPhotoPicker = useCallback(() => {
    if (!inputRef.current || sending || disabled) {
      return;
    }

    inputRef.current.value = '';
    inputRef.current.click();
  }, [disabled, sending]);

  useEffect(() => {
    onRegisterPhotoPicker?.(settlementId, openPhotoPicker);
    return () => onRegisterPhotoPicker?.(settlementId, null);
  }, [onRegisterPhotoPicker, openPhotoPicker, settlementId]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file || !['image/jpeg', 'image/png'].includes(file.type)) {
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setPhoto({ file, previewUrl });
  }

  const closeConfirmation = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPhoto(null);
  }, []);

  function retakePhoto() {
    closeConfirmation();
    openPhotoPicker();
  }

  return (
    <>
      <div
        className={cn(
          'flex w-[240px] max-w-full flex-col gap-[15px] rounded-[12px] bg-[var(--color-bg-brand-weak)] px-4 pt-4 pb-3',
          className,
        )}
        data-component="transfer-photo-request"
      >
        <Text as="p" className="m-0 break-words" color="fg.neutral" variant="t5Bold">
          송금한 화면을 첨부해주세요
        </Text>
        <div className="-mx-1 w-[calc(100%+8px)]">
          <Button
            className="h-[44px] !rounded-[10px]"
            disabled={sending || disabled}
            onClick={openPhotoPicker}
            size="medium"
            variant="brand-solid"
            width="fill"
          >
            사진 첨부하기
          </Button>
        </div>
      </div>
      <input
        ref={inputRef}
        accept="image/jpeg,image/png"
        aria-label="송금 사진 선택"
        className="sr-only"
        onChange={handlePhotoChange}
        type="file"
      />
      {photo ? (
        <TaxiMeterPhotoConfirmation
          onBack={closeConfirmation}
          onRetake={retakePhoto}
          onSend={() => onSend(photo.file)}
          photoAlt="선택한 송금 사진"
          previewUrl={photo.previewUrl}
          retakeLabel="다시 선택하기"
          screenLabel="송금 사진 확인 화면"
          sending={sending}
        />
      ) : null}
    </>
  );
}
