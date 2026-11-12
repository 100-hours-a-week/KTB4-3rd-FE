'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { TransferAnalysisFinishedMessage } from '@/entities/chat';
import { getAccessToken } from '@/entities/auth';
import {
  settlementQueries,
  submitTransferProof,
  uploadSettlementImage,
  useCompleteSettlementMutation,
} from '@/features/taxi-pot-settlement';
import { ApiError } from '@/shared/api/client';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const TRANSFER_RETRY_LIMIT_MESSAGE = '인증 횟수를 모두 사용했어요. 대면 인증을 해주세요.';
const TRANSFER_AMOUNT_MISMATCH_MESSAGE = '송금 금액이 일치하지 않아요';

type TransferProofTarget = {
  settlementId: number;
  userId: number;
} | null;

export type UseChatRoomTransferSettlementModelOptions = {
  isTaxiPotHost: boolean;
  settlementId?: number;
};

export function useChatRoomTransferSettlementModel({
  isTaxiPotHost,
  settlementId,
}: UseChatRoomTransferSettlementModelOptions) {
  const queryClient = useQueryClient();
  const completeSettlementMutation = useCompleteSettlementMutation();
  const [uploadingTransferPhoto, setUploadingTransferPhoto] = useState(false);
  const [transferProofTarget, setTransferProofTarget] = useState<TransferProofTarget>(null);
  const [transferAnalysisSettlementId, setTransferAnalysisSettlementId] = useState<number | null>(
    null,
  );
  const [transferSubmissionBlockedSettlementId, setTransferSubmissionBlockedSettlementId] =
    useState<number | null>(null);
  const [analysisResetKey, setAnalysisResetKey] = useState(0);
  const transferPhotoPickerRefs = useRef(new Map<number, () => void>());
  const settlementAnalysisFinishedMessageRef = useRef<TransferAnalysisFinishedMessage | null>(null);
  const activeAnalysisSettlementIdRef = useRef<number | null>(null);
  const analysisCompletionHandledRef = useRef(false);
  const transferAnalysisQuery = useQuery(
    settlementQueries.myParticipant(
      transferAnalysisSettlementId ?? undefined,
      transferAnalysisSettlementId !== null,
    ),
  );
  const transferParticipantData = transferAnalysisQuery.data?.data;
  const transferAnalysisStatus =
    transferParticipantData && 'member_analysis_status' in transferParticipantData
      ? transferParticipantData.member_analysis_status
      : undefined;
  const activeTransferFailedSettlementId =
    transferAnalysisStatus === 'FAILED' ? transferAnalysisSettlementId : null;
  const isTransferAnalysisOpen =
    transferAnalysisSettlementId !== null &&
    !transferAnalysisQuery.isError &&
    (transferAnalysisStatus === undefined ||
      transferAnalysisStatus === 'PENDING' ||
      transferAnalysisStatus === 'ANALYZING');

  useEffect(() => {
    if (transferAnalysisSettlementId === null || !transferAnalysisQuery.isError) {
      return;
    }

    useSnackbarStore
      .getState()
      .showSnackbar(
        transferAnalysisQuery.error instanceof Error
          ? transferAnalysisQuery.error.message
          : '송금 사진 분석 상태를 확인하지 못했어요',
        'critical',
      );
  }, [transferAnalysisQuery.error, transferAnalysisQuery.isError, transferAnalysisSettlementId]);

  const handleViewTransferProof = useCallback(
    (targetSettlementId: number, userId: number) => {
      if (!isTaxiPotHost) {
        return;
      }

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        useSnackbarStore
          .getState()
          .showSnackbar('송금자를 확인할 수 없어 인증 사진을 열지 못했어요', 'critical');
        return;
      }

      setTransferProofTarget({ settlementId: targetSettlementId, userId });
    },
    [isTaxiPotHost],
  );

  const handleRegisterTransferPhotoPicker = useCallback(
    (targetSettlementId: number, openPicker: (() => void) | null) => {
      if (openPicker) {
        transferPhotoPickerRefs.current.set(targetSettlementId, openPicker);
      } else {
        transferPhotoPickerRefs.current.delete(targetSettlementId);
      }
    },
    [],
  );

  const handleSettlementAnalysisFinished = useCallback(
    (message: TransferAnalysisFinishedMessage) => {
      if (
        message.settlement_id !== activeAnalysisSettlementIdRef.current ||
        analysisCompletionHandledRef.current
      ) {
        return;
      }

      analysisCompletionHandledRef.current = true;
      setAnalysisResetKey((currentKey) => currentKey + 1);
      settlementAnalysisFinishedMessageRef.current = message;
      void queryClient.invalidateQueries({
        queryKey: settlementQueries.myParticipant(message.settlement_id).queryKey,
      });

      if (message.transfer_completed) {
        setTransferSubmissionBlockedSettlementId(message.settlement_id);
        setTransferAnalysisSettlementId(null);
      } else if (message.remaining_transfer_attempts === 0) {
        setTransferSubmissionBlockedSettlementId(message.settlement_id);
        setTransferAnalysisSettlementId(null);
        useSnackbarStore.getState().showSnackbar(TRANSFER_RETRY_LIMIT_MESSAGE, 'critical');
      } else if (message.member_analysis_status === 'FAILED') {
        setTransferSubmissionBlockedSettlementId(null);
        setTransferAnalysisSettlementId(message.settlement_id);
      } else {
        setTransferSubmissionBlockedSettlementId(null);
        setTransferAnalysisSettlementId(null);
        useSnackbarStore.getState().showSnackbar(TRANSFER_AMOUNT_MISMATCH_MESSAGE, 'critical');
      }

      activeAnalysisSettlementIdRef.current = null;
    },
    [queryClient],
  );

  const handleReselectTransferPhoto = useCallback(() => {
    if (activeTransferFailedSettlementId === null) {
      return;
    }

    const openPicker = transferPhotoPickerRefs.current.get(activeTransferFailedSettlementId);
    setTransferAnalysisSettlementId(null);
    openPicker?.();
  }, [activeTransferFailedSettlementId]);

  const handleAcknowledgeSettlement = useCallback(
    async (targetSettlementId: number) => {
      try {
        await completeSettlementMutation.mutateAsync(targetSettlementId);
      } catch (error) {
        useSnackbarStore
          .getState()
          .showSnackbar(
            error instanceof Error ? error.message : '정산을 완료하지 못했어요',
            'critical',
          );
      }
    },
    [completeSettlementMutation],
  );

  const handleSendTransferPhoto = useCallback(
    async (targetSettlementId: number, file: File) => {
      activeAnalysisSettlementIdRef.current = targetSettlementId;
      analysisCompletionHandledRef.current = false;
      setTransferSubmissionBlockedSettlementId(null);
      setUploadingTransferPhoto(true);
      settlementAnalysisFinishedMessageRef.current = null;
      try {
        const token = await getAccessToken();
        const imageKey = await uploadSettlementImage(token, 'TRANSFER', file);
        const response = await submitTransferProof(token, targetSettlementId, {
          transfer_image_key: imageKey,
        });
        if (response.status !== 202) {
          throw new Error('송금 사진 분석 요청을 시작하지 못했어요');
        }

        await queryClient.removeQueries({
          queryKey: settlementQueries.myParticipant(targetSettlementId).queryKey,
          exact: true,
        });
        const finishedTransferMessage =
          settlementAnalysisFinishedMessageRef.current as TransferAnalysisFinishedMessage | null;

        if (!finishedTransferMessage) {
          setAnalysisResetKey((currentKey) => currentKey + 1);
          setTransferAnalysisSettlementId(targetSettlementId);
        }

        if (
          finishedTransferMessage?.member_analysis_status === 'FAILED' &&
          finishedTransferMessage.remaining_transfer_attempts > 0
        ) {
          setTransferAnalysisSettlementId(targetSettlementId);
        }
      } catch (error) {
        activeAnalysisSettlementIdRef.current = null;
        analysisCompletionHandledRef.current = false;
        setTransferAnalysisSettlementId(null);
        setAnalysisResetKey((currentKey) => currentKey + 1);
        let errorMessage = '송금 사진을 보내지 못했어요';
        if (error instanceof ApiError && error.code === 'TRANSFER_RETRY_LIMIT_EXCEEDED') {
          errorMessage = TRANSFER_RETRY_LIMIT_MESSAGE;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        useSnackbarStore.getState().showSnackbar(errorMessage, 'critical');
      } finally {
        setUploadingTransferPhoto(false);
      }
    },
    [queryClient],
  );

  return {
    activeTransferFailedSettlementId,
    analysisResetKey,
    completingSettlement: completeSettlementMutation.isPending,
    handleAcknowledgeSettlement,
    handleRegisterTransferPhotoPicker,
    handleReselectTransferPhoto,
    handleSendTransferPhoto,
    handleSettlementAnalysisFinished,
    handleViewTransferProof,
    isTransferAnalysisOpen,
    onTransferProofOpenChange: (open: boolean) => {
      if (!open) {
        setTransferProofTarget(null);
      }
    },
    transferProofTarget,
    transferSubmissionBlockedSettlementId,
    uploadingTransferPhoto,
    settlementId,
  };
}
