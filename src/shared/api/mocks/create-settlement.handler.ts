import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';

export const createSettlementHandler = http.post('*/settlements', async ({ request }) => {
  const userId = settlementMock.getCurrentUserId(request);
  if (userId === null) {
    return settlementMock.unauthorizedResponse();
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
    typeof body.companion_id !== 'number' ||
    !Number.isSafeInteger(body.companion_id)
  ) {
    return settlementMock.errorResponse(
      '요청 형식이 올바르지 않습니다.',
      'MALFORMED_REQUEST',
      null,
      400,
    );
  }

  const companionId = body.companion_id;
  if (companionId === 999) {
    return settlementMock.serverErrorResponse();
  }

  const participants = settlementMock.createParticipantsForCompanion(companionId);
  if (
    ![30, 31, 33].includes(companionId) ||
    !participants.some((participant) => participant.id === userId)
  ) {
    return settlementMock.notFoundResponse();
  }

  const host = participants.find((participant) => participant.id === 7);
  if (!host || host.id !== userId) {
    return settlementMock.errorResponse('방장만 정산을 시작할 수 있습니다', 'FORBIDDEN', null, 403);
  }

  if (typeof body.meter_image_key !== 'string' || !body.meter_image_key.startsWith('tmp/meter/')) {
    return settlementMock.errorResponse(
      '요청 형식이 올바르지 않습니다.',
      'MALFORMED_REQUEST',
      null,
      400,
    );
  }

  const settlement = settlementMock.createSettlement(companionId, participants);
  settlement.meter_image_url = `https://mock-images.local/${body.meter_image_key}`;
  return HttpResponse.json(
    {
      message: '미터기 금액 분석 상태를 확인하세요.',
      data: {
        settlement_id: settlement.id,
        participant_count: settlement.participant_count,
        group_settlement_status: settlement.group_settlement_status,
        meter_analysis_status: settlement.meter_analysis_status,
        analysis_started_at: settlement.analysis_started_at,
        remaining_meter_attempts: Math.max(0, 2 - settlement.meter_image_attempts),
      },
    },
    { status: 202 },
  );
});
