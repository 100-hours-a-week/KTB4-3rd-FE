import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';

export const getSettlementStatusHandler = http.get(
  '*/settlements/:settlementId',
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

    return HttpResponse.json({
      message: '정산 상태를 조회했습니다',
      data: {
        id: settlement.id,
        group_settlement_status: settlement.group_settlement_status,
        meter_analysis_status: settlement.meter_analysis_status,
        total_amount: settlement.total_amount,
        participant_count: settlement.participant_count,
        ...(settlement.amount_per_person === undefined
          ? {}
          : { amount_per_person: settlement.amount_per_person }),
        ...(settlement.completed_at ? { completed_at: settlement.completed_at } : {}),
        participants:
          settlement.group_settlement_status === 'PENDING'
            ? []
            : settlement.participants.map((participant) => {
                settlementMock.advanceMemberAnalysis(participant);
                return {
                  user_id: participant.user_id,
                  name: participant.name,
                  profile_image_url: participant.profile_image_url,
                  amount: settlement.amount_per_person,
                  member_analysis_status: participant.member_analysis_status,
                  ...(participant.transferred_at
                    ? { transferred_at: participant.transferred_at }
                    : {}),
                  has_transfer_proof: participant.transfer_image_url !== undefined,
                };
              }),
      },
    });
  },
);
