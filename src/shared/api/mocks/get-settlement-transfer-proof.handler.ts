import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';

export const getSettlementTransferProofHandler = http.get(
  '*/settlements/:settlementId/participants/:userId/transfer-proof',
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

    const targetUserId = Number(params.userId);
    const target = settlementMock.getParticipant(settlement, targetUserId);
    if (!target) {
      return settlementMock.errorResponse('송금 내역이 없습니다', 'TRANSFER_NOT_FOUND', null, 404);
    }
    if (userId !== settlement.host_id && userId !== targetUserId) {
      return settlementMock.errorResponse(
        '방장 또는 본인의 송금 내역만 조회할 수 있습니다',
        'TRANSFER_PROOF_FORBIDDEN',
        null,
        403,
      );
    }

    settlementMock.advanceMemberAnalysis(target);
    const imageUrl = target.transfer_image_url ? new URL(target.transfer_image_url) : null;
    imageUrl?.searchParams.set('expires', '1800');
    imageUrl?.searchParams.set('mock', '1');

    return HttpResponse.json({
      message: '송금 인증 사진을 조회했습니다',
      data: {
        member_analysis_status: target.member_analysis_status,
        ...(imageUrl ? { image_url: imageUrl.toString() } : {}),
        ...(target.transferred_at ? { transferred_at: target.transferred_at } : {}),
      },
    });
  },
);
