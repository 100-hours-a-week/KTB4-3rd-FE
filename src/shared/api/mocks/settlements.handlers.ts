import { createSettlementHandler } from './create-settlement.handler';
import { getSettlementAnalysisStatusHandler } from './get-settlement-analysis-status.handler';

export const settlementHandlers = [createSettlementHandler, getSettlementAnalysisStatusHandler];
