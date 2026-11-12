'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';

import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { Field } from '@/shared/ui/field';
import { Icon } from '@/shared/ui/icon';
import { ResultSection } from '@/shared/ui/result-section';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';
import { Textarea } from '@/shared/ui/textarea';

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
          onCheckStatus?: () => void;
          isCheckingStatus?: boolean;
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
      <div className="flex min-h-[436px] items-center px-6">
        <ResultSection
          buttons="primary"
          className="mx-auto !h-auto min-h-[280px]"
          description={props.errorMessage ?? '요청 정보를 불러오지 못했어요. 다시 시도해주세요.'}
          primaryButtonProps={{ onClick: props.onRetry }}
          primaryLabel="다시 불러오기"
          size="medium"
          title="요청을 불러오지 못했어요"
        />
      </div>
    );
  } else {
    content = (
      <RequestContent
        canAccept={props.canAccept}
        canReject={props.canReject}
        isCheckingStatus={props.isCheckingStatus ?? false}
        notice={props.notice}
        onAccept={props.onAccept}
        onCheckStatus={props.onCheckStatus}
        onReject={props.onReject}
        processingAction={props.processingAction}
        request={props.request}
      />
    );
  }

  return (
    <BaseDialog.Root
      disablePointerDismissal={dismissalLocked}
      onOpenChange={(open, eventDetails) => {
        if (open) {
          return;
        }
        if (dismissalLocked) {
          eventDetails.cancel();
          return;
        }
        props.onClose();
      }}
      open
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className="fixed inset-0 z-40 min-h-dvh bg-[var(--color-bg-overlay)] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute"
          data-testid="dialog-backdrop"
        />
        <BaseDialog.Viewport className="fixed inset-0 z-50 mx-auto flex min-h-dvh w-full max-w-[393px] items-center justify-center py-4">
          <BaseDialog.Popup
            aria-label="카풀 요청 확인"
            className="relative flex h-[min(504px,calc(100dvh-32px))] min-h-0 w-[calc(100vw_-_32px)] max-w-[361px] flex-col overflow-hidden rounded-[24px] border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-layer-default)] text-[var(--color-fg-neutral)] shadow-[0_8px_12px_rgba(0,0,0,0.18)] outline-none"
            data-testid="carpool-request-modal"
          >
            <header className="flex h-11 shrink-0 items-center bg-[var(--color-bg-layer-default)]">
              {dismissalLocked ? null : (
                <BaseDialog.Close
                  aria-label="닫기"
                  className="inline-flex size-11 items-center justify-center rounded-[var(--dimension-x2)] text-[var(--color-fg-neutral)] transition-colors hover:bg-[var(--color-bg-transparent-pressed)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]"
                  type="button"
                >
                  <Icon name="xmark" size={16} />
                </BaseDialog.Close>
              )}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

function RequestLoadingState() {
  return (
    <div
      aria-label="요청 정보 불러오는 중"
      className="flex min-h-[436px] flex-col items-center justify-center gap-6 px-6"
      role="status"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-[90px] rounded-full" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="h-[170px] w-full rounded-[14px]" />
      <span className="sr-only">요청 정보를 불러오는 중</span>
    </div>
  );
}

type RequestContentProps = {
  canAccept: boolean;
  canReject: boolean;
  isCheckingStatus: boolean;
  notice?: string;
  onAccept: () => void;
  onCheckStatus?: () => void;
  onReject: () => void;
  processingAction: RequestProcessingAction;
  request: CarpoolRequestDetailView;
};

function RequestContent({
  canAccept,
  canReject,
  isCheckingStatus,
  notice,
  onAccept,
  onCheckStatus,
  onReject,
  processingAction,
  request,
}: RequestContentProps) {
  const isProcessing = processingAction !== null;

  return (
    <div className="flex h-[436px] min-h-0 flex-col px-[24px]">
      <div className="flex shrink-0 flex-col items-center">
        <Avatar
          alt={`${request.requester.name} 프로필`}
          className="!border-0 bg-[var(--brand-weak,#e6f5ff)]"
          size={90}
          src={request.requester.profile_image_url}
        />
        <Text className="mt-2" variant="t8Bold">
          {request.requester.name}
        </Text>
      </div>
      <Divider className="mt-3 shrink-0" color="var(--color-stroke-neutral-weak)" />
      <div className="mt-4 min-h-0 flex-1">
        <Field
          className="gap-2"
          inputSlot={
            <Textarea
              autoSize={false}
              className="h-[170px] [&>div]:!bg-transparent"
              onValueChange={() => {}}
              readOnly
              textareaClassName="h-full read-only:text-[var(--color-fg-neutral)]"
              value={request.content}
            />
          }
          label="요청 메시지"
          labelWeight="medium"
        />
      </div>
      {notice ? (
        <p aria-live="polite" className="mb-2 text-xs text-[var(--color-fg-critical)]">
          {notice}
        </p>
      ) : null}
      {onCheckStatus ? (
        <Button
          className="mb-2"
          disabled={isProcessing || isCheckingStatus}
          loading={isCheckingStatus}
          onClick={onCheckStatus}
          size="small"
          variant="neutral-outline"
          width="fill"
        >
          요청 상태 다시 확인
        </Button>
      ) : null}
      <div className="flex shrink-0 gap-3">
        <Button
          className="!h-[52px] !min-h-[52px] !min-w-0 flex-1 !shrink !rounded-[14px]"
          disabled={isProcessing || !canAccept}
          loading={processingAction === 'accept'}
          onClick={onAccept}
          size="large"
          textVariant="t6Bold"
          variant="brand-solid"
          width="fill"
        >
          수락
        </Button>
        <Button
          className="!h-[52px] !min-h-[52px] !min-w-0 flex-1 !shrink !rounded-[14px]"
          disabled={isProcessing || !canReject}
          loading={processingAction === 'reject'}
          onClick={onReject}
          size="large"
          textVariant="t6Bold"
          variant="neutral-weak"
          width="fill"
        >
          거절
        </Button>
      </div>
    </div>
  );
}
