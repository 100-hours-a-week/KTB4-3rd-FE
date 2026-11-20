import { createSettlementHandler } from './create-settlement.handler';
import { getSettlementAnalysisStatusHandler } from './get-settlement-analysis-status.handler';
import { updateSettlementAmountHandler } from './update-settlement-amount.handler';
import { submitTransferProofHandler } from './submit-transfer-proof.handler';
import { getMySettlementParticipantHandler } from './get-my-settlement-participant.handler';
import { getSettlementTransferProofHandler } from './get-settlement-transfer-proof.handler';
import { completeSettlementHandler } from './complete-settlement.handler';
import { getSettlementStatusHandler } from './get-settlement-status.handler';
import { getSettlementMeterImageHandler } from './get-settlement-meter-image.handler';
import { submitMeterImageHandler } from './submit-meter-image.handler';

export const settlementHandlers = [
  createSettlementHandler,
  submitMeterImageHandler,
  getSettlementAnalysisStatusHandler,
  updateSettlementAmountHandler,
  submitTransferProofHandler,
  getMySettlementParticipantHandler,
  getSettlementTransferProofHandler,
  completeSettlementHandler,
  getSettlementStatusHandler,
  getSettlementMeterImageHandler,
];
