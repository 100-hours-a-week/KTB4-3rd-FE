import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';
import { emitMockSettlementAnalysisFinished } from './chat-room-websocket.handlers';

export const submitTransferProofHandler = http.post(
  '*/settlements/:settlementId/transfer-proof',
  async ({ request, params }) => {
    const userId = settlementMock.getCurrentUserId(request);
    if (userId === null) {
      return settlementMock.unauthorizedResponse();
    }

    const settlement = settlementMock.getSettlement(String(params.settlementId));
    if (settlement === 'internal-server-error') {
      return settlementMock.serverErrorResponse();
    }
    if (!settlement || !settlementMock.isParticipant(settlement, userId)) {
      return settlementMock.notFoundResponse();
    }

    if (settlement.host_id === userId) {
      return settlementMock.errorResponse(
        '방장은 송금할 금액이 없어요',
        'PAYEE_HAS_NO_TRANSFER',
        null,
        403,
      );
    }

    const participant = settlementMock.getParticipant(settlement, userId);
    if (!participant) {
      return settlementMock.notFoundResponse();
    }

    if (participant.member_analysis_status === 'PASSED' || participant.transferred_at) {
      return settlementMock.errorResponse(
        '이미 송금이 확인됐어요',
        'ALREADY_TRANSFERRED',
        null,
        409,
      );
    }

    if (participant.transfer_attempts >= 2) {
      return settlementMock.errorResponse(
        '인증 횟수를 모두 사용했어요. 대면 인증을 해주세요.',
        'TRANSFER_RETRY_LIMIT_EXCEEDED',
        null,
        409,
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return settlementMock.errorResponse(
        '요청 값 검증에 실패했습니다.',
        'VALIDATION_ERROR',
        'transfer_image_key',
        422,
      );
    }

    if (!settlementMock.isObject(body) || typeof body.transfer_image_key !== 'string') {
      return settlementMock.errorResponse(
        '요청 값 검증에 실패했습니다.',
        'VALIDATION_ERROR',
        'transfer_image_key',
        422,
      );
    }

    if (!body.transfer_image_key.trim() || !body.transfer_image_key.startsWith('tmp/transfer/')) {
      return settlementMock.errorResponse(
        '요청 값 검증에 실패했습니다.',
        'VALIDATION_ERROR',
        null,
        422,
      );
    }

    if (settlement.group_settlement_status !== 'REQUESTED') {
      return settlementMock.errorResponse(
        '송금 인증을 할 수 있는 상태가 아니에요',
        'TRANSFER_NOT_SUBMITTABLE',
        null,
        409,
      );
    }

    if (participant.member_analysis_status === 'ANALYZING') {
      return settlementMock.errorResponse(
        '송금 내역을 확인하고 있어요',
        'TRANSFER_ANALYSIS_IN_PROGRESS',
        null,
        409,
      );
    }

    participant.transfer_attempts += 1;
    participant.transfer_image_url = `https://mock-images.local/${body.transfer_image_key}`;
    participant.member_analysis_status = 'ANALYZING';
    participant.analysis_result_pending = true;
    participant.transferred_at = undefined;
    participant.is_forged = false;
    setTimeout(() => {
      settlementMock.advanceMemberAnalysis(participant);
      if (
        participant.member_analysis_status === 'PASSED' ||
        participant.member_analysis_status === 'FAILED'
      ) {
        emitMockSettlementAnalysisFinished({
          type: 'TRANSFER_ANALYZED',
          settlement_id: settlement.id,
          user_id: userId,
          name: participant.name,
          member_analysis_status: participant.member_analysis_status,
          transfer_completed: participant.member_analysis_status === 'PASSED',
          remaining_transfer_attempts: Math.max(0, 2 - participant.transfer_attempts),
        });
      }
    }, 500);

    return HttpResponse.json(
      {
        message: 'AI 송금 분석 상태를 확인하세요.',
        data: {
          group_settlement_status: settlement.group_settlement_status,
          remaining_transfer_attempts: Math.max(0, 2 - participant.transfer_attempts),
        },
      },
      { status: 202 },
    );
  },
);
