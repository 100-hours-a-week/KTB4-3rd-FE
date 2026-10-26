'use client';

import { useState, type MouseEvent } from 'react';

import type { OwnedCar, OwnedCarRegistrationPayload } from '@/entities/owned-car';
import { Dialog } from '@/shared/ui/dialog';
import { InputField } from '@/shared/ui/input-field';
import { Text } from '@/shared/ui/text';

export type OwnedCarEditDialogProps = {
  car: OwnedCar;
  errorMessage?: string;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: OwnedCarRegistrationPayload) => void;
  open: boolean;
};

export function OwnedCarEditDialog({
  car,
  errorMessage,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
  open,
}: OwnedCarEditDialogProps) {
  const [vehicleNumber, setVehicleNumber] = useState(car.number);
  const [vehicleModel, setVehicleModel] = useState(car.model);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const isValid =
    vehicleNumber.trim().length > 0 &&
    vehicleNumber.length <= 20 &&
    vehicleModel.trim().length > 0 &&
    vehicleModel.length <= 50;

  const handleSubmit = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!vehicleNumber.trim() || !vehicleModel.trim()) {
      setValidationMessage('차량 번호와 차종을 입력해주세요.');
      return;
    }

    if (vehicleNumber.length > 20 || vehicleModel.length > 50) {
      setValidationMessage('차량 번호는 20자, 차종은 50자 이내로 입력해주세요.');
      return;
    }

    setValidationMessage(null);
    onSubmit({ model: vehicleModel.trim(), number: vehicleNumber.trim() });
  };

  const message = validationMessage ?? errorMessage;

  return (
    <Dialog
      buttons="primarySecondary"
      description="변경된 차량 정보를 입력해주세요."
      disablePointerDismissal={isSubmitting}
      open={open}
      primaryButtonProps={{
        disabled: !isValid,
        loading: isSubmitting,
        onClick: handleSubmit,
      }}
      primaryLabel="저장하기"
      secondaryButtonProps={{ disabled: isSubmitting }}
      showCloseButton={false}
      title="차량 정보 수정"
      onOpenChange={(nextOpen) => {
        if (isSubmitting && !nextOpen) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <div className="flex flex-col gap-6" data-clarity-mask="true">
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
        {message ? (
          <Text aria-live="polite" color="fg.critical" variant="t3Regular">
            {message}
          </Text>
        ) : null}
      </div>
    </Dialog>
  );
}
