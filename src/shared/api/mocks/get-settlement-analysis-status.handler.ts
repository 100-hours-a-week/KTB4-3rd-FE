import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';

export const getSettlementAnalysisStatusHandler = http.get(
  '*/settlements/:settlementId/analysis-status',
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

    settlementMock.advanceMeterAnalysis(settlement);

    return HttpResponse.json({
      message: '미터기 금액 인식 상태를 조회했습니다',
      data: {
        group_settlement_status: settlement.group_settlement_status,
        meter_analysis_status: settlement.meter_analysis_status,
        total_amount: settlement.total_amount,
        remaining_meter_attempts: Math.max(0, 2 - settlement.meter_image_attempts),
        ...(settlement.analysis_started_at
          ? { analysis_started_at: settlement.analysis_started_at }
          : {}),
      },
    });
  },
);
