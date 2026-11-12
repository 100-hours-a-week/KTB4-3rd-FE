export type ChatReportTarget =
  | {
      type: 'message';
      reportedMessageId: number;
      reportedUserId: number;
    }
  | {
      type: 'user';
      reportedUserId: number;
    };
