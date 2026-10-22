'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { MeterAnalysisFinishedMessage } from '@/entities/chat';
import { getAccessToken } from '@/entities/auth';
import {
  settlementQueries,
  submitMeterImage,
  updateSettlementAmount,
  uploadSettlementImage,
} from '@/features/taxi-pot-settlement';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

type MeterAmountTarget = {
  settlementId: number;
  recognitionFailed: boolean;
} | null;

export type UseChatRoomMeterSettlementModelOptions = {
  settlementId?: number;
};

export function useChatRoomMeterSettlementModel({
  settlementId,
}: UseChatRoomMeterSettlementModelOptions) {
  const queryClient = useQueryClient();
  const [uploadingMeterPhoto, setUploadingMeterPhoto] = useState(false);
  const [meterImageTarget, setMeterImageTarget] = useState<number | null>(null);
  const [meterAnalysisSettlementId, setMeterAnalysisSettlementId] = useState<number | null>(null);
  const [meterAnalysisFinishedMessage, setMeterAnalysisFinishedMessage] =
    useState<MeterAnalysisFinishedMessage | null>(null);
  const meterAnalysisFinishedMessageRef = useRef<MeterAnalysisFinishedMessage | null>(null);
  const [isMeterAnalysisDelayed, setIsMeterAnalysisDelayed] = useState(false);
  const [meterAmountTarget, setMeterAmountTarget] = useState<MeterAmountTarget>(null);
  const [meterAmount, setMeterAmount] = useState('');
  const [savingSettlementAmount, setSavingSettlementAmount] = useState(false);
  const [analysisResetKey, setAnalysisResetKey] = useState(0);
  const meterPhotoPickerRef = useRef<(() => void) | null>(null);
  const activeAnalysisSettlementIdRef = useRef<number | null>(null);
  const analysisCompletionHandledRef = useRef(false);
  const meterAnalysisQuery = useQuery(
    settlementQueries.analysisStatus(settlementId, settlementId !== undefined),
  );
  const meterAnalysisFinished =
    meterAnalysisFinishedMessage?.settlement_id === settlementId
      ? meterAnalysisFinishedMessage
      : null;
  const meterAnalysisStatus =
    meterAnalysisFinished?.meter_analysis_status ??
    meterAnalysisQuery.data?.data.meter_analysis_status;
  const remainingMeterAttempts =
    meterAnalysisFinished?.remaining_meter_attempts ??
    meterAnalysisQuery.data?.data.remaining_meter_attempts;
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

  const handleViewMeterImage = useCallback((targetSettlementId: number) => {
    setMeterImageTarget(targetSettlementId);
  }, []);

  const handleRegisterMeterPhotoPicker = useCallback((openPicker: (() => void) | null) => {
    meterPhotoPickerRef.current = openPicker;
  }, []);

  const handleSettlementAnalysisFinished = useCallback(
    (message: MeterAnalysisFinishedMessage) => {
      if (
        message.settlement_id !== activeAnalysisSettlementIdRef.current ||
        analysisCompletionHandledRef.current
      ) {
        return;
      }

      analysisCompletionHandledRef.current = true;
      setAnalysisResetKey((currentKey) => currentKey + 1);
      meterAnalysisFinishedMessageRef.current = message;
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
      meterAnalysisFinishedMessageRef.current = null;
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

  const handleSendMeterPhoto = useCallback(
    async (targetSettlementId: number, file: File) => {
      if (remainingMeterAttempts === 0) {
        handleManualMeterEntry(targetSettlementId);
        return;
      }

      activeAnalysisSettlementIdRef.current = targetSettlementId;
      analysisCompletionHandledRef.current = false;
      setUploadingMeterPhoto(true);
      meterAnalysisFinishedMessageRef.current = null;
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
          meterAnalysisFinishedMessageRef.current as MeterAnalysisFinishedMessage | null;
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
        setUploadingMeterPhoto(false);
      }
    },
    [handleManualMeterEntry, queryClient, remainingMeterAttempts],
  );

  return {
    activeMeterAmountTarget,
    analysisResetKey,
    handleManualMeterEntry,
    handleRefreshSettlementStatus,
    handleRegisterMeterPhotoPicker,
    handleRetakeMeterPhoto,
    handleSendMeterPhoto,
    handleSettleMeterAmount,
    handleSettlementAnalysisFinished,
    handleViewMeterImage,
    isMeterAnalysisDelayed,
    isMeterAnalysisOpen,
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
    onMeterAmountChange: setMeterAmount,
    remainingMeterAttempts,
    savingSettlementAmount,
    uploadingMeterPhoto,
  };
}
