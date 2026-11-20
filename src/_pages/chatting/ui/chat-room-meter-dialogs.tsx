import {
  SettlementMeterImageDialog,
  TaxiMeterAnalysisDialog,
  TaxiMeterAmountDialog,
} from '@/features/taxi-pot-settlement';

type MeterImageDialogProps = {
  target: number | null;
  onOpenChange: (open: boolean) => void;
};

type MeterAnalysisDialogsProps = {
  isDelayed: boolean;
  isOpen: boolean;
  amountTarget: { recognitionFailed: boolean } | null;
  amount: string;
  remainingAttempts?: number;
  savingAmount: boolean;
  onManualEntry: (settlementId?: number) => void;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  onRetakePhoto: () => void;
  onSettle: () => void;
};

export type ChatRoomMeterDialogsProps = {
  image: MeterImageDialogProps;
  analysis: MeterAnalysisDialogsProps;
};

function MeterAnalysisDialogs({
  isDelayed,
  isOpen,
  amountTarget,
  amount,
  remainingAttempts,
  savingAmount,
  onManualEntry,
  onOpenChange,
  onValueChange,
  onRetakePhoto,
  onSettle,
}: MeterAnalysisDialogsProps) {
  return (
    <>
      <TaxiMeterAnalysisDialog delayed={isDelayed} onManualEntry={onManualEntry} open={isOpen} />
      <TaxiMeterAmountDialog
        onOpenChange={onOpenChange}
        onRetakePhoto={onRetakePhoto}
        onSettle={onSettle}
        onValueChange={onValueChange}
        open={amountTarget !== null}
        allowRetakePhoto={remainingAttempts !== 0}
        recognitionFailed={amountTarget?.recognitionFailed}
        submitting={savingAmount}
        value={amount}
      />
    </>
  );
}

export function ChatRoomMeterDialogs({ image, analysis }: ChatRoomMeterDialogsProps) {
  return (
    <>
      <SettlementMeterImageDialog
        onOpenChange={image.onOpenChange}
        open={image.target !== null}
        settlementId={image.target ?? undefined}
      />
      <MeterAnalysisDialogs {...analysis} />
    </>
  );
}
