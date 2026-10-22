import {
  ChatLeaveDialog,
  ChatReportDialog,
  type ChatReportDialogSubmitPayload,
  ChatSatisfactionDialog,
  type ChatSatisfactionDialogSubmitPayload,
  type ChatSatisfactionParticipant,
} from '@/features/chatting';

type LeaveDialogProps = {
  open: boolean;
  loading: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

type ReportDialogProps = {
  open: boolean;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ChatReportDialogSubmitPayload) => void;
};

type EvaluationDialogProps = {
  open: boolean;
  loading: boolean;
  participants?: readonly ChatSatisfactionParticipant[];
  onReport: (participant: ChatSatisfactionParticipant) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ChatSatisfactionDialogSubmitPayload) => void;
};

export type ChatRoomActionDialogsProps = {
  leave: LeaveDialogProps;
  report: ReportDialogProps;
  evaluation: EvaluationDialogProps;
};

export function ChatRoomActionDialogs({ leave, report, evaluation }: ChatRoomActionDialogsProps) {
  return (
    <>
      <ChatLeaveDialog
        confirmButtonProps={{
          disabled: leave.loading,
          loading: leave.loading,
          onClick: (event) => event.preventDefault(),
        }}
        onConfirm={leave.onConfirm}
        onOpenChange={leave.onOpenChange}
        open={leave.open}
      />
      <ChatReportDialog
        onOpenChange={report.onOpenChange}
        open={report.open}
        onSubmit={report.onSubmit}
        submitButtonProps={{
          disabled: report.loading,
          loading: report.loading,
          onClick: (event) => event.preventDefault(),
        }}
      />
      <ChatSatisfactionDialog
        disablePointerDismissal
        onReport={evaluation.onReport}
        onOpenChange={evaluation.onOpenChange}
        open={evaluation.open}
        onSubmit={evaluation.onSubmit}
        participants={evaluation.participants}
        submitButtonProps={{
          disabled: evaluation.loading,
          loading: evaluation.loading,
          onClick: (event) => event.preventDefault(),
        }}
      />
    </>
  );
}
