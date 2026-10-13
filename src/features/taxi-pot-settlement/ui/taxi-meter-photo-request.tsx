'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

export type TaxiMeterPhotoRequestProps = {
  onSend: (file: File) => void;
  sending?: boolean;
  className?: string;
};

export type TaxiMeterPhotoConfirmationProps = {
  previewUrl: string;
  onBack: () => void;
  onRetake: () => void;
  onSend: () => void;
  sending?: boolean;
};

/** The photo confirmation screen is shown after the native picker returns an image. */
export function TaxiMeterPhotoConfirmation({
  previewUrl,
  onBack,
  onRetake,
  onSend,
  sending = false,
}: TaxiMeterPhotoConfirmationProps) {
  return (
    <section
      aria-label="미터기 사진 확인 화면"
      className="fixed inset-y-0 left-1/2 z-50 flex w-full max-w-[393px] -translate-x-1/2 flex-col bg-[var(--color-bg-layer-default)]"
    >
      <Header
        leftSlot={
          <button
            aria-label="사진 확인 닫기"
            className="inline-flex size-11 items-center justify-center"
            onClick={onBack}
            type="button"
          >
            <Icon name="chevronLeft" size={24} />
          </button>
        }
        title="사진 확인"
      />
      <div className="relative mx-5 mt-[72px] min-h-0 flex-1">
        <Image
          alt="선택한 택시 미터기 사진"
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
          onClick={onRetake}
          size="large"
          variant="neutral-weak"
          width="fill"
        >
          재촬영
        </Button>
      </div>
    </section>
  );
}

/** A settlement system message that opens the device image picker and previews its result. */
export function TaxiMeterPhotoRequest({
  onSend,
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

  function openPhotoPicker() {
    if (!inputRef.current || sending) {
      return;
    }

    // The native value must be cleared to allow selecting the same image again.
    inputRef.current.value = '';
    inputRef.current.click();
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setPhoto({ file, previewUrl });
  }

  function closeConfirmation() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPhoto(null);
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
          <Button
            className="h-[44px] !rounded-[10px]"
            onClick={openPhotoPicker}
            size="medium"
            variant="brand-solid"
            width="fill"
          >
            확인
          </Button>
        </div>
      </div>
      <input
        ref={inputRef}
        accept="image/*"
        aria-label="택시 미터기 사진 선택"
        className="sr-only"
        onChange={handlePhotoChange}
        type="file"
      />
      {photo ? (
        <TaxiMeterPhotoConfirmation
          onBack={closeConfirmation}
          onRetake={openPhotoPicker}
          onSend={() => onSend(photo.file)}
          previewUrl={photo.previewUrl}
          sending={sending}
        />
      ) : null}
    </>
  );
}
