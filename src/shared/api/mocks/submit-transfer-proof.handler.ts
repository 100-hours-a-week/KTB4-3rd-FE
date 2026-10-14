import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';

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
      return settlementMock.errorResponse('존재하지 않는 정산입니다', 'NOT_FOUND', null, 404);
    }

    const participant = settlementMock.getParticipant(settlement, userId);
    if (!participant) {
      return settlementMock.errorResponse(
        '본인의 정산만 처리할 수 있습니다',
        'FORBIDDEN',
        null,
        403,
      );
    }

    if (participant.transfer_attempts >= 2) {
      return settlementMock.errorResponse(
        '최대 재시도(1회) 횟수를 초과하였습니다',
        'RETRY_LIMIT_EXCEEDED',
        null,
        409,
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return settlementMock.errorResponse(
        '요청 형식이 올바르지 않습니다.',
        'MALFORMED_REQUEST',
        null,
        400,
      );
    }

    if (
      !settlementMock.isObject(body) ||
      !settlementMock.hasValidImageUrl(body.transfer_image_url)
    ) {
      return settlementMock.errorResponse(
        '요청 형식이 올바르지 않습니다.',
        'MALFORMED_REQUEST',
        null,
        400,
      );
    }

    if (settlement.group_settlement_status !== 'REQUESTED') {
      return settlementMock.errorResponse(
        '송금 요청 전에는 인증할 수 없습니다',
        'INVALID_STATE_TRANSITION',
        null,
        409,
      );
    }

    if (participant.member_analysis_status === 'ANALYZING') {
      return settlementMock.errorResponse(
        '송금 인증을 분석 중입니다',
        'INVALID_STATE_TRANSITION',
        null,
        409,
      );
    }

    participant.transfer_attempts += 1;
    participant.transfer_image_url = body.transfer_image_url;
    participant.member_analysis_status = 'ANALYZING';
    participant.analysis_result_pending = true;
    participant.transferred_at = undefined;
    participant.is_forged = false;

    return HttpResponse.json(
      {
        message: 'AI 송금 분석 상태를 확인하세요.',
        data: {
          participant_count: settlement.participant_count,
          group_settlement_status: settlement.group_settlement_status,
          member_analysis_status: participant.member_analysis_status,
        },
      },
      { status: 202 },
    );
  },
);
