'use client';

import { useSettlementTransferProofQuery } from '@/features/taxi-pot-settlement/model/use-settlement-transfer-proof-query';
import { Dialog } from '@/shared/ui/dialog';
import { Text } from '@/shared/ui/text';
import Image from 'next/image';

export type SettlementTransferProofDialogProps = {
  open: boolean;
  settlementId?: number;
  userId?: number;
  onOpenChange: (open: boolean) => void;
};

export function SettlementTransferProofDialog({
  open,
  settlementId,
  userId,
  onOpenChange,
}: SettlementTransferProofDialogProps) {
  const proofQuery = useSettlementTransferProofQuery(settlementId, userId, open);
  const imageUrl = proofQuery.data?.data.image_url;

  function renderContent() {
    if (proofQuery.isPending) {
      return (
        <Text as="p" color="fg.neutralMuted" variant="t5Regular">
          인증 사진을 불러오는 중이에요.
        </Text>
      );
    }
    if (proofQuery.isError) {
      return (
        <Text as="p" color="fg.neutralMuted" variant="t5Regular">
          인증 사진을 불러오지 못했어요. 다시 열어주세요.
        </Text>
      );
    }
    if (!imageUrl) {
      return (
        <Text as="p" color="fg.neutralMuted" variant="t5Regular">
          아직 송금 인증 사진을 제출하지 않았어요.
        </Text>
      );
    }

    return (
      <Image
        alt="송금 인증 사진"
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
      title="송금 인증 사진"
    >
      <div className="flex min-h-36 items-center justify-center">{renderContent()}</div>
    </Dialog>
  );
}
