'use client';

import { useState, type MouseEvent } from 'react';

import type { OwnedCarRegistrationPayload } from '@/entities/owned-car';
import { Dialog } from '@/shared/ui/dialog';
import { InputField } from '@/shared/ui/input-field';

type CarpoolVehicleRegistrationDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (payload: OwnedCarRegistrationPayload) => void;
  onOpenChange: (open: boolean) => void;
};

export function CarpoolVehicleRegistrationDialog({
  open,
  isSubmitting,
  errorMessage,
  onSubmit,
  onOpenChange,
}: CarpoolVehicleRegistrationDialogProps) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting && !nextOpen) {
      return;
    }

    if (!nextOpen) {
      setVehicleNumber('');
      setVehicleModel('');
      setValidationMessage(null);
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!vehicleNumber.trim() || !vehicleModel.trim()) {
      setValidationMessage('차량 번호와 차종을 입력해주세요.');
      return;
    }

    if (vehicleNumber.length > 20 || vehicleModel.length > 50) {
      setValidationMessage('차량 번호는 20자, 차종은 50자 이내로 입력해주세요.');
      return;
    }

    setValidationMessage(null);
    onSubmit({ number: vehicleNumber, model: vehicleModel });
  };

  return (
    <Dialog
      buttons="primarySecondary"
      className="!w-[calc(100%-40px)] !max-w-[353px] [&_[data-testid=dialog-body]]:!px-5 [&_[data-testid=dialog-body]]:!pt-7 [&_[data-testid=dialog-body]]:!pb-0 [&_[data-testid=dialog-footer]]:!flex-col [&_[data-testid=dialog-footer]]:!gap-[6px] [&_[data-testid=dialog-footer]]:!px-5 [&_[data-testid=dialog-footer]]:!pt-5 [&_[data-testid=dialog-footer]]:!pb-5 [&_[data-testid=dialog-header]]:!border-b-0 [&_[data-testid=dialog-header]]:!px-6 [&_[data-testid=dialog-header]]:!pt-8 [&_[data-testid=dialog-header]]:!pb-0"
      description="등록을 위해 차량 정보를 입력해주세요"
      open={open}
      primaryLabel="확인"
      primaryButtonProps={{ disabled: isSubmitting, loading: isSubmitting, onClick: handleSubmit }}
      secondaryLabel="취소"
      secondaryButtonProps={{ disabled: isSubmitting }}
      showCloseButton={false}
      title="카풀 등록이 처음이시군요!"
      disablePointerDismissal={isSubmitting}
      onOpenChange={handleOpenChange}
    >
      <div className="flex flex-col gap-6" data-node-id="1417:35673">
        <InputField
          aria-label="차량 번호"
          label="차량 번호"
          maxLength={20}
          placeholder="차량번호를 입력해주세요"
          value={vehicleNumber}
          onValueChange={(value) => {
            setVehicleNumber(value);
            setValidationMessage(null);
          }}
        />
        <InputField
          aria-label="차종"
          label="차종"
          maxLength={50}
          placeholder="차종을 입력해주세요"
          value={vehicleModel}
          onValueChange={(value) => {
            setVehicleModel(value);
            setValidationMessage(null);
          }}
        />
        {validationMessage || errorMessage ? (
          <p aria-live="polite" className="text-sm text-[var(--color-fg-critical)]">
            {validationMessage ?? errorMessage}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
