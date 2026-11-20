import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';

export const updateSettlementAmountHandler = http.put(
  '*/settlements/:settlementId/amount',
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
      return settlementMock.errorResponse('방장만 처리할 수 있어요', 'HOST_ONLY', null, 403);
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
      typeof body.total_amount !== 'number' ||
      !Number.isFinite(body.total_amount)
    ) {
      return settlementMock.errorResponse(
        '요청 형식이 올바르지 않습니다.',
        'MALFORMED_REQUEST',
        null,
        400,
      );
    }

    const totalAmount = body.total_amount;
    if (!Number.isInteger(totalAmount) || totalAmount < 1 || totalAmount > 999_999) {
      return HttpResponse.json(
        {
          message: '요청 값 검증에 실패했습니다.',
          error: {
            code: 'VALIDATION_ERROR',
            field: 'total_amount',
            details: [{ field: 'total_amount', reason: 'OUT_OF_RANGE' }],
          },
        },
        { status: 422 },
      );
    }

    if (settlementMock.groupError(settlement.group_settlement_status)) {
      return settlementMock.errorResponse(
        '이미 정산 금액이 정해졌어요',
        'ALREADY_REQUESTED',
        null,
        409,
      );
    }

    settlement.total_amount = totalAmount;
    settlement.amount_per_person = Math.floor(totalAmount / settlement.participant_count);
    settlement.group_settlement_status = 'REQUESTED';
    settlement.meter_analysis_status = 'MANUAL';
    settlement.meter_analysis_result_pending = false;
    settlement.participants.forEach((participant) => {
      participant.member_analysis_status = 'PENDING';
    });

    return HttpResponse.json({
      message: '수동으로 입력받은 값으로 정산을 진행합니다.',
      data: {
        participant_count: settlement.participant_count,
        amount_per_person: settlement.amount_per_person,
        group_settlement_status: settlement.group_settlement_status,
        meter_analysis_status: settlement.meter_analysis_status,
      },
    });
  },
);
