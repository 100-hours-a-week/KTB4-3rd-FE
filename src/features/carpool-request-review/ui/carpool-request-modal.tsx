'use client';

import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { ResultSection } from '@/shared/ui/result-section';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

export type CarpoolRequestDetailView = {
  id: number;
  carpool_id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  requester: {
    id: number;
    name: string;
    profile_image_url: string | null;
  };
  content: string;
  created_at: string;
};

export type RequestProcessingAction = 'accept' | 'reject' | null;

type CarpoolRequestModalProps =
  | { open: false }
  | ({ open: true; onClose: () => void } & (
      | { status: 'loading'; lockDismissal?: boolean }
      | { status: 'error'; errorMessage?: string; onRetry: () => void }
      | {
          status: 'content';
          request: CarpoolRequestDetailView;
          processingAction: RequestProcessingAction;
          notice?: string;
          canAccept: boolean;
          canReject: boolean;
          onAccept: () => void;
          onReject: () => void;
        }
    ));

export function CarpoolRequestModal(props: CarpoolRequestModalProps) {
  if (!props.open) {
    return null;
  }

  const processingAction = props.status === 'content' ? props.processingAction : null;
  const dismissalLocked =
    processingAction !== null || (props.status === 'loading' && props.lockDismissal === true);
  let content;

  if (props.status === 'loading') {
    content = <RequestLoadingState />;
  } else if (props.status === 'error') {
    content = (
      <ResultSection
        buttons="primary"
        className="mx-auto !h-auto min-h-[280px]"
        description={props.errorMessage ?? '요청 정보를 불러오지 못했어요. 다시 시도해주세요.'}
        primaryButtonProps={{ onClick: props.onRetry }}
        primaryLabel="다시 불러오기"
        size="medium"
        title="요청을 불러오지 못했어요"
      />
    );
  } else {
    content = (
      <RequestContent
        canAccept={props.canAccept}
        canReject={props.canReject}
        notice={props.notice}
        onAccept={props.onAccept}
        onReject={props.onReject}
        processingAction={props.processingAction}
        request={props.request}
      />
    );
  }

  return (
    <Dialog
      buttons="none"
      disablePointerDismissal={dismissalLocked}
      onOpenChange={(open) => {
        if (!open && !dismissalLocked) {
          props.onClose();
        }
      }}
      open
      showCloseButton={!dismissalLocked}
      title="카풀 요청 확인"
    >
      {content}
    </Dialog>
  );
}

function RequestLoadingState() {
  return (
    <div aria-label="요청 정보 불러오는 중" className="flex flex-col gap-6" role="status">
      <div className="flex items-center gap-3">
        <Skeleton className="size-[52px] rounded-full" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="h-24 w-full rounded-[12px]" />
      <span className="sr-only">요청 정보를 불러오는 중</span>
    </div>
  );
}

type RequestContentProps = {
  canAccept: boolean;
  canReject: boolean;
  notice?: string;
  onAccept: () => void;
  onReject: () => void;
  processingAction: RequestProcessingAction;
  request: CarpoolRequestDetailView;
};

function RequestContent({
  canAccept,
  canReject,
  notice,
  onAccept,
  onReject,
  processingAction,
  request,
}: RequestContentProps) {
  const isProcessing = processingAction !== null;

  return (
    <div className="flex flex-col gap-6">
      {notice ? (
        <p aria-live="polite" className="text-sm text-[var(--color-fg-critical)]">
          {notice}
        </p>
      ) : null}
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          alt={`${request.requester.name} 프로필`}
          size={52}
          src={request.requester.profile_image_url}
        />
        <Text className="min-w-0 truncate" variant="t5Bold">
          {request.requester.name}
        </Text>
      </div>
      <div className="min-h-24 rounded-[12px] bg-[var(--color-bg-neutral-weak)] p-4 break-words whitespace-pre-wrap">
        <Text variant="t5Regular">{request.content}</Text>
      </div>
      <div className="flex gap-3">
        <Button
          disabled={isProcessing || !canReject}
          loading={processingAction === 'reject'}
          onClick={onReject}
          size="large"
          variant="neutral-weak"
          width="fill"
        >
          거절
        </Button>
        <Button
          disabled={isProcessing || !canAccept}
          loading={processingAction === 'accept'}
          onClick={onAccept}
          size="large"
          variant="brand-solid"
          width="fill"
        >
          수락
        </Button>
      </div>
    </div>
  );
}
