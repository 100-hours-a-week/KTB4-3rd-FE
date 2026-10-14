import { createSettlementHandler } from './create-settlement.handler';
import { getSettlementAnalysisStatusHandler } from './get-settlement-analysis-status.handler';
import { updateSettlementAmountHandler } from './update-settlement-amount.handler';

export const settlementHandlers = [
  createSettlementHandler,
  getSettlementAnalysisStatusHandler,
  updateSettlementAmountHandler,
];
