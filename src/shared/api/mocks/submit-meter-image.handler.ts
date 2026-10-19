import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';
import { emitMockSettlementAnalysisFinished } from './chat-room-websocket.handlers';

export const submitMeterImageHandler = http.post(
  '*/settlements/:settlementId/meter-image',
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
    if (settlement.host_id !== userId) {
      return settlementMock.errorResponse(
        '방장만 미터기 사진을 제출할 수 있습니다',
        'FORBIDDEN',
        null,
        403,
      );
    }
    if (settlement.group_settlement_status !== 'PENDING') {
      return settlementMock.errorResponse(
        '이미 정산 금액이 정해졌어요',
        'ALREADY_REQUESTED',
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
      typeof body.meter_image_key !== 'string' ||
      !body.meter_image_key.startsWith('tmp/meter/')
    ) {
      return settlementMock.errorResponse(
        '요청 형식이 올바르지 않습니다.',
        'MALFORMED_REQUEST',
        null,
        400,
      );
    }

    if (!settlementMock.submitMeterImage(settlement, body.meter_image_key)) {
      return settlementMock.errorResponse(
        '미터기 사진 제출 횟수를 초과했어요',
        'METER_ATTEMPTS_EXCEEDED',
        null,
        409,
      );
    }

    const remaining = Math.max(0, 2 - settlement.meter_image_attempts);
    setTimeout(() => {
      settlementMock.advanceMeterAnalysis(settlement);
      emitMockSettlementAnalysisFinished({
        type: 'METER_ANALYSIS_FINISHED',
        settlement_id: settlement.id,
        meter_analysis_status: settlement.meter_analysis_status === 'FAILED' ? 'FAILED' : 'PASSED',
        remaining_meter_attempts: remaining,
      });
    }, 500);

    return HttpResponse.json(
      {
        message: '미터기 금액 분석 상태를 확인하세요.',
        data: {
          group_settlement_status: settlement.group_settlement_status,
          meter_analysis_status: settlement.meter_analysis_status,
          total_amount: settlement.total_amount,
          analysis_started_at: settlement.analysis_started_at,
          remaining_meter_attempts: remaining,
        },
      },
      { status: 202 },
    );
  },
);
