import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';

export const completeSettlementHandler = http.post(
  '*/settlements/:settlementId/completion',
  ({ request, params }) => {
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
    if (settlement.group_settlement_status !== 'REQUESTED') {
      return settlementMock.errorResponse(
        '정산을 완료할 수 있는 상태가 아니에요',
        'INVALID_STATE_TRANSITION',
        null,
        409,
      );
    }

    settlement.group_settlement_status = 'COMPLETED';
    settlement.completed_at = settlementMock.currentTimestamp();
    return new HttpResponse(null, { status: 204 });
  },
);
