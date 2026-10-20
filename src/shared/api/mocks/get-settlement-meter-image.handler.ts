import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';

export const getSettlementMeterImageHandler = http.get(
  '*/settlements/:settlementId/meter-image',
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
    const imageUrl = settlement.meter_image_url ? new URL(settlement.meter_image_url) : null;
    imageUrl?.searchParams.set('expires', '1800');
    imageUrl?.searchParams.set('mock', '1');

    return HttpResponse.json({
      message: '미터기 사진을 조회했습니다',
      data: {
        meter_analysis_status: settlement.meter_analysis_status,
        ...(imageUrl ? { image_url: imageUrl.toString() } : {}),
      },
    });
  },
);
