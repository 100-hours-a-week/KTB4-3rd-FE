'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { SettlementAnalysisFinishedMessage } from '@/entities/chat';
import { getAccessToken } from '@/entities/auth';
import {
  submitMeterImage,
  submitTransferProof,
  settlementQueries,
  uploadSettlementImage,
  updateSettlementAmount,
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

type MeterImageTarget = number | null;

type MeterAmountTarget = {
  settlementId: number;
  recognitionFailed: boolean;
} | null;

export function useChatRoomSettlementModel(settlementId?: number, isTaxiPotHost = false) {
  const queryClient = useQueryClient();
  const completeSettlementMutation = useCompleteSettlementMutation();
  const [uploadingSettlementPhoto, setUploadingSettlementPhoto] = useState(false);
  const [transferProofTarget, setTransferProofTarget] = useState<TransferProofTarget>(null);
  const [meterImageTarget, setMeterImageTarget] = useState<MeterImageTarget>(null);
  const [meterAnalysisSettlementId, setMeterAnalysisSettlementId] = useState<number | null>(null);
  const [meterAnalysisFinishedMessage, setMeterAnalysisFinishedMessage] =
    useState<SettlementAnalysisFinishedMessage | null>(null);
  const settlementAnalysisFinishedMessageRef = useRef<SettlementAnalysisFinishedMessage | null>(
    null,
  );
  const [isMeterAnalysisDelayed, setIsMeterAnalysisDelayed] = useState(false);
  const [meterAmountTarget, setMeterAmountTarget] = useState<MeterAmountTarget>(null);
  const [meterAmount, setMeterAmount] = useState('');
  const [savingSettlementAmount, setSavingSettlementAmount] = useState(false);
  const [transferAnalysisSettlementId, setTransferAnalysisSettlementId] = useState<number | null>(
    null,
  );
  const [transferSubmissionBlockedSettlementId, setTransferSubmissionBlockedSettlementId] =
    useState<number | null>(null);
  const [analysisResetKey, setAnalysisResetKey] = useState(0);
  const meterPhotoPickerRef = useRef<(() => void) | null>(null);
  const transferPhotoPickerRefs = useRef(new Map<number, () => void>());
  const activeAnalysisSettlementIdRef = useRef<number | null>(null);
  const analysisCompletionHandledRef = useRef(false);
  const meterAnalysisQuery = useQuery(
    settlementQueries.analysisStatus(settlementId, settlementId !== undefined),
  );
  const transferAnalysisQuery = useQuery(
    settlementQueries.myParticipant(
      transferAnalysisSettlementId ?? undefined,
      transferAnalysisSettlementId !== null,
    ),
  );
  const meterAnalysisFinished =
    meterAnalysisFinishedMessage?.type === 'METER_ANALYSIS_FINISHED' &&
    meterAnalysisFinishedMessage.settlement_id === settlementId
      ? meterAnalysisFinishedMessage
      : null;
  const meterAnalysisStatus =
    meterAnalysisFinished?.meter_analysis_status ??
    meterAnalysisQuery.data?.data.meter_analysis_status;
  const remainingMeterAttempts =
    meterAnalysisFinished?.remaining_meter_attempts ??
    meterAnalysisQuery.data?.data.remaining_meter_attempts;
  const transferParticipantData = transferAnalysisQuery.data?.data;
  const transferAnalysisStatus =
    transferParticipantData && 'member_analysis_status' in transferParticipantData
      ? transferParticipantData.member_analysis_status
      : undefined;
  const isMeterAnalysisOpen =
    meterAnalysisSettlementId !== null &&
    !meterAnalysisQuery.isError &&
    (meterAnalysisStatus === undefined ||
      meterAnalysisStatus === 'PENDING' ||
      meterAnalysisStatus === 'ANALYZING');
  const activeMeterAmountTarget = useMemo<MeterAmountTarget>(
    () =>
      meterAmountTarget ??
      (meterAnalysisStatus === 'FAILED' && meterAnalysisSettlementId !== null
        ? { settlementId: meterAnalysisSettlementId, recognitionFailed: true }
        : null),
    [meterAnalysisSettlementId, meterAnalysisStatus, meterAmountTarget],
  );
  const activeTransferFailedSettlementId =
    transferAnalysisStatus === 'FAILED' ? transferAnalysisSettlementId : null;

  useEffect(() => {
    if (
      meterAnalysisSettlementId === null ||
      meterAnalysisStatus === 'PASSED' ||
      meterAnalysisStatus === 'FAILED'
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsMeterAnalysisDelayed(true), 10_000);
    return () => window.clearTimeout(timeoutId);
  }, [meterAnalysisSettlementId, meterAnalysisStatus]);

  useEffect(() => {
    if (meterAnalysisSettlementId === null || !meterAnalysisQuery.isError) {
      return;
    }

    useSnackbarStore
      .getState()
      .showSnackbar(
        meterAnalysisQuery.error instanceof Error
          ? meterAnalysisQuery.error.message
          : '미터기 사진 분석 상태를 확인하지 못했어요',
        'critical',
      );
  }, [meterAnalysisQuery.error, meterAnalysisQuery.isError, meterAnalysisSettlementId]);

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
    async (targetSettlementId: number, nickname: string) => {
      if (!isTaxiPotHost) {
        return;
      }

      try {
        const response = await queryClient.fetchQuery(settlementQueries.status(targetSettlementId));
        const matchingParticipants = response.data.participants.filter(
          (participant) => participant.name === nickname,
        );

        if (matchingParticipants.length !== 1) {
          useSnackbarStore
            .getState()
            .showSnackbar('송금자를 확인할 수 없어 인증 사진을 열지 못했어요', 'critical');
          return;
        }

        setTransferProofTarget({
          settlementId: targetSettlementId,
          userId: matchingParticipants[0].user_id,
        });
      } catch (error) {
        useSnackbarStore
          .getState()
          .showSnackbar(
            error instanceof Error ? error.message : '송금 내역을 불러오지 못했어요',
            'critical',
          );
      }
    },
    [isTaxiPotHost, queryClient],
  );

  const handleViewMeterImage = useCallback((targetSettlementId: number) => {
    setMeterImageTarget(targetSettlementId);
  }, []);

  const handleRegisterMeterPhotoPicker = useCallback((openPicker: (() => void) | null) => {
    meterPhotoPickerRef.current = openPicker;
  }, []);

  const handleSettlementAnalysisFinished = useCallback(
    (message: SettlementAnalysisFinishedMessage) => {
      if (
        message.settlement_id !== activeAnalysisSettlementIdRef.current ||
        analysisCompletionHandledRef.current
      ) {
        return;
      }

      analysisCompletionHandledRef.current = true;
      setAnalysisResetKey((currentKey) => currentKey + 1);
      settlementAnalysisFinishedMessageRef.current = message;

      if (message.type === 'TRANSFER_ANALYZED') {
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
        return;
      }

      setMeterAnalysisFinishedMessage(message);
      if (message.meter_analysis_status === 'FAILED') {
        setMeterAnalysisSettlementId(message.settlement_id);
        setIsMeterAnalysisDelayed(false);
      } else if (message.settlement_id === meterAnalysisSettlementId) {
        setMeterAnalysisSettlementId(null);
      }
      queryClient.setQueryData(
        settlementQueries.analysisStatus(message.settlement_id).queryKey,
        (current) =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  meter_analysis_status: message.meter_analysis_status,
                  remaining_meter_attempts: message.remaining_meter_attempts,
                },
              }
            : current,
      );
      activeAnalysisSettlementIdRef.current = null;
    },
    [meterAnalysisSettlementId, queryClient],
  );

  const handleRefreshSettlementStatus = useCallback(() => {
    if (!settlementId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: settlementQueries.analysisStatus(settlementId).queryKey,
    });
  }, [queryClient, settlementId]);

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

  const handleManualMeterEntry = useCallback(
    (targetSettlementId?: number) => {
      const targetId = targetSettlementId ?? meterAnalysisSettlementId ?? settlementId;
      if (targetId === undefined || targetId === null) {
        return;
      }

      setMeterAnalysisSettlementId(null);
      setIsMeterAnalysisDelayed(false);
      setMeterAmount('');
      setMeterAmountTarget({
        settlementId: targetId,
        recognitionFailed: false,
      });
    },
    [meterAnalysisSettlementId, settlementId],
  );

  const handleRetakeMeterPhoto = useCallback(() => {
    setMeterAnalysisSettlementId(null);
    setMeterAmountTarget(null);
    meterPhotoPickerRef.current?.();
  }, []);

  const handleReselectTransferPhoto = useCallback(() => {
    if (activeTransferFailedSettlementId === null) {
      return;
    }

    const openPicker = transferPhotoPickerRefs.current.get(activeTransferFailedSettlementId);
    setTransferAnalysisSettlementId(null);
    openPicker?.();
  }, [activeTransferFailedSettlementId]);

  const handleSettleMeterAmount = useCallback(async () => {
    if (activeMeterAmountTarget === null) {
      return;
    }

    const totalAmount = Number(meterAmount);
    if (!Number.isSafeInteger(totalAmount) || totalAmount < 1 || totalAmount > 999_999) {
      useSnackbarStore
        .getState()
        .showSnackbar('1원 이상 999,999원 이하로 입력해주세요', 'critical');
      return;
    }

    setSavingSettlementAmount(true);
    try {
      await updateSettlementAmount(await getAccessToken(), activeMeterAmountTarget.settlementId, {
        total_amount: totalAmount,
      });
      queryClient.setQueryData(
        settlementQueries.analysisStatus(activeMeterAmountTarget.settlementId).queryKey,
        (current) =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  meter_analysis_status: 'MANUAL' as const,
                  group_settlement_status: 'REQUESTED' as const,
                  total_amount: totalAmount,
                },
              }
            : current,
      );
      settlementAnalysisFinishedMessageRef.current = null;
      setMeterAnalysisFinishedMessage(null);
      setMeterAnalysisSettlementId(null);
      setMeterAmountTarget(null);
      setMeterAmount('');
    } catch (error) {
      useSnackbarStore
        .getState()
        .showSnackbar(
          error instanceof Error ? error.message : '정산 금액을 저장하지 못했어요',
          'critical',
        );
    } finally {
      setSavingSettlementAmount(false);
    }
  }, [activeMeterAmountTarget, meterAmount, queryClient]);

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

  const handleSendMeterPhoto = useCallback(
    async (targetSettlementId: number, file: File) => {
      if (remainingMeterAttempts === 0) {
        handleManualMeterEntry(targetSettlementId);
        return;
      }
      activeAnalysisSettlementIdRef.current = targetSettlementId;
      analysisCompletionHandledRef.current = false;
      setUploadingSettlementPhoto(true);
      settlementAnalysisFinishedMessageRef.current = null;
      setMeterAnalysisFinishedMessage(null);
      try {
        const token = await getAccessToken();
        const imageKey = await uploadSettlementImage(token, 'METER', file);
        const response = await submitMeterImage(token, targetSettlementId, {
          meter_image_key: imageKey,
        });
        if (response.status !== 202) {
          throw new Error('미터기 사진 분석 요청을 시작하지 못했어요');
        }

        setIsMeterAnalysisDelayed(false);
        setMeterAmount('');
        const finishedMessage =
          settlementAnalysisFinishedMessageRef.current as SettlementAnalysisFinishedMessage | null;
        if (finishedMessage?.settlement_id !== targetSettlementId) {
          setAnalysisResetKey((currentKey) => currentKey + 1);
          queryClient.setQueryData(settlementQueries.analysisStatus(targetSettlementId).queryKey, {
            message: response.data.message,
            data: response.data.data,
          });
          setMeterAnalysisSettlementId(targetSettlementId);
        }
      } catch (error) {
        activeAnalysisSettlementIdRef.current = null;
        analysisCompletionHandledRef.current = false;
        setMeterAnalysisSettlementId(null);
        setMeterAnalysisFinishedMessage(null);
        setIsMeterAnalysisDelayed(false);
        setAnalysisResetKey((currentKey) => currentKey + 1);
        useSnackbarStore
          .getState()
          .showSnackbar(
            error instanceof Error ? error.message : '미터기 사진을 보내지 못했어요',
            'critical',
          );
      } finally {
        setUploadingSettlementPhoto(false);
      }
    },
    [handleManualMeterEntry, queryClient, remainingMeterAttempts],
  );

  const handleSendTransferPhoto = useCallback(
    async (targetSettlementId: number, file: File) => {
      activeAnalysisSettlementIdRef.current = targetSettlementId;
      analysisCompletionHandledRef.current = false;
      setTransferSubmissionBlockedSettlementId(null);
      setUploadingSettlementPhoto(true);
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
        const finishedMessage =
          settlementAnalysisFinishedMessageRef.current as SettlementAnalysisFinishedMessage | null;
        const finishedTransferMessage =
          finishedMessage?.type === 'TRANSFER_ANALYZED' &&
          finishedMessage.settlement_id === targetSettlementId
            ? finishedMessage
            : null;

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
        setUploadingSettlementPhoto(false);
      }
    },
    [queryClient],
  );

  return {
    activeMeterAmountTarget,
    activeTransferFailedSettlementId,
    analysisResetKey,
    completingSettlement: completeSettlementMutation.isPending,
    handleAcknowledgeSettlement,
    handleManualMeterEntry,
    handleRefreshSettlementStatus,
    handleRegisterMeterPhotoPicker,
    handleRegisterTransferPhotoPicker,
    handleReselectTransferPhoto,
    handleRetakeMeterPhoto,
    handleSendMeterPhoto,
    handleSendTransferPhoto,
    handleSettleMeterAmount,
    handleSettlementAnalysisFinished,
    handleViewMeterImage,
    handleViewTransferProof,
    isMeterAnalysisDelayed,
    isMeterAnalysisOpen,
    isTransferAnalysisOpen:
      transferAnalysisSettlementId !== null &&
      !transferAnalysisQuery.isError &&
      (transferAnalysisStatus === undefined ||
        transferAnalysisStatus === 'PENDING' ||
        transferAnalysisStatus === 'ANALYZING'),
    meterAmount,
    meterAnalysisStatus,
    meterImageTarget,
    meterSettlementId: settlementId,
    onMeterAmountOpenChange: (open: boolean) => {
      if (!open) {
        setMeterAmountTarget(null);
      }
    },
    onMeterImageOpenChange: (open: boolean) => {
      if (!open) {
        setMeterImageTarget(null);
      }
    },
    onTransferProofOpenChange: (open: boolean) => {
      if (!open) {
        setTransferProofTarget(null);
      }
    },
    onMeterAmountChange: setMeterAmount,
    remainingMeterAttempts,
    savingSettlementAmount,
    transferProofTarget,
    transferSubmissionBlockedSettlementId,
    uploadingSettlementPhoto,
  };
}
