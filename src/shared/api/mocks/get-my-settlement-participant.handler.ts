import { http, HttpResponse } from 'msw';

import * as settlementMock from './settlements.mock-state';

export const getMySettlementParticipantHandler = http.get(
  '*/settlements/:settlementId/participants/me',
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

    if (settlement.group_settlement_status === 'PENDING') {
      return HttpResponse.json({
        message: '내 송금 상태를 조회했습니다',
        data: {
          participant_count: settlement.participant_count,
          group_settlement_status: settlement.group_settlement_status,
        },
      });
    }

    settlementMock.advanceMemberAnalysis(participant);
    return HttpResponse.json({
      message: '내 송금 상태를 조회했습니다',
      data: {
        participant_count: settlement.participant_count,
        group_settlement_status: settlement.group_settlement_status,
        member_analysis_status: participant.member_analysis_status,
        amount: settlement.amount_per_person,
        payee: {
          name: settlement.host_name,
          bank_name: settlement.host_bank_name,
          account_no: settlement.host_account_no,
        },
        ...(participant.transferred_at ? { transferred_at: participant.transferred_at } : {}),
      },
    });
  },
);
