'use client';

import { useState } from 'react';

import { Dialog } from '@/shared/ui/dialog';
import { InputField } from '@/shared/ui/input-field';

type CarpoolVehicleRegistrationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CarpoolVehicleRegistrationDialog({
  open,
  onOpenChange,
}: CarpoolVehicleRegistrationDialogProps) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setVehicleNumber('');
      setVehicleModel('');
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog
      buttons="primarySecondary"
      className="!w-[calc(100%-40px)] !max-w-[353px] [&_[data-testid=dialog-body]]:!px-5 [&_[data-testid=dialog-body]]:!pt-7 [&_[data-testid=dialog-body]]:!pb-0 [&_[data-testid=dialog-footer]]:!flex-col [&_[data-testid=dialog-footer]]:!gap-[6px] [&_[data-testid=dialog-footer]]:!px-5 [&_[data-testid=dialog-footer]]:!pt-5 [&_[data-testid=dialog-footer]]:!pb-5 [&_[data-testid=dialog-header]]:!border-b-0 [&_[data-testid=dialog-header]]:!px-6 [&_[data-testid=dialog-header]]:!pt-8 [&_[data-testid=dialog-header]]:!pb-0"
      description="등록을 위해 차량 정보를 입력해주세요"
      open={open}
      primaryLabel="확인"
      secondaryLabel="취소"
      showCloseButton={false}
      title="카풀 등록이 처음이시군요!"
      onOpenChange={handleOpenChange}
    >
      <div className="flex flex-col gap-6" data-node-id="1417:35673">
        <InputField
          aria-label="차량 번호"
          label="차량 번호"
          placeholder="차량번호를 입력해주세요"
          value={vehicleNumber}
          onValueChange={setVehicleNumber}
        />
        <InputField
          aria-label="차종"
          label="차종"
          placeholder="차종을 입력해주세요"
          value={vehicleModel}
          onValueChange={setVehicleModel}
        />
      </div>
    </Dialog>
  );
}
