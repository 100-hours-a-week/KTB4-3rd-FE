import {
  SettlementTransferProofDialog,
  TransferConfirmationAnalysisDialog,
  TransferConfirmationRecognitionFailedDialog,
} from '@/features/taxi-pot-settlement';

type TransferProofDialogProps = {
  target: {
    settlementId: number;
    userId: number;
  } | null;
  onOpenChange: (open: boolean) => void;
};

type TransferAnalysisDialogsProps = {
  isOpen: boolean;
  failedSettlementId: number | null;
  onReselectPhoto: () => void;
};

export type ChatRoomTransferDialogsProps = {
  proof: TransferProofDialogProps;
  analysis: TransferAnalysisDialogsProps;
};

function TransferAnalysisDialogs({
  isOpen,
  failedSettlementId,
  onReselectPhoto,
}: TransferAnalysisDialogsProps) {
  return (
    <>
      <TransferConfirmationAnalysisDialog open={isOpen} />
      <TransferConfirmationRecognitionFailedDialog
        onReselectPhoto={onReselectPhoto}
        open={failedSettlementId !== null}
      />
    </>
  );
}

export function ChatRoomTransferDialogs({ proof, analysis }: ChatRoomTransferDialogsProps) {
  return (
    <>
      <SettlementTransferProofDialog
        onOpenChange={proof.onOpenChange}
        open={proof.target !== null}
        settlementId={proof.target?.settlementId}
        userId={proof.target?.userId}
      />
      <TransferAnalysisDialogs {...analysis} />
    </>
  );
}
