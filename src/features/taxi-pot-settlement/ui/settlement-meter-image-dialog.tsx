'use client';

import Image from 'next/image';

import { useSettlementMeterImageQuery } from '@/features/taxi-pot-settlement/model/use-settlement-meter-image-query';
import { Dialog } from '@/shared/ui/dialog';
import { Text } from '@/shared/ui/text';

export type SettlementMeterImageDialogProps = {
  open: boolean;
  settlementId?: number;
  onOpenChange: (open: boolean) => void;
};

export function SettlementMeterImageDialog({
  open,
  settlementId,
  onOpenChange,
}: SettlementMeterImageDialogProps) {
  const meterImageQuery = useSettlementMeterImageQuery(settlementId, open);
  const imageUrl = meterImageQuery.data?.data.image_url;

  function renderContent() {
    if (meterImageQuery.isPending) {
      return (
        <Text as="p" color="fg.neutralMuted" variant="t5Regular">
          미터기 사진을 불러오는 중이에요.
        </Text>
      );
    }
    if (meterImageQuery.isError) {
      return (
        <Text as="p" color="fg.neutralMuted" variant="t5Regular">
          미터기 사진을 불러오지 못했어요. 다시 열어주세요.
        </Text>
      );
    }
    if (!imageUrl) {
      return (
        <Text as="p" color="fg.neutralMuted" variant="t5Regular">
          미터기 사진이 없어요.
        </Text>
      );
    }

    return (
      <Image
        alt="택시 미터기 사진"
        className="h-auto max-h-[60vh] max-w-full object-contain"
        height={1500}
        src={imageUrl}
        unoptimized
        width={1200}
      />
    );
  }

  return (
    <Dialog
      buttons="none"
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton
      title="미터기 사진"
    >
      <div className="flex min-h-36 items-center justify-center">{renderContent()}</div>
    </Dialog>
  );
}
