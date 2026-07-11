import type { BaseRecord, Cents } from "./base";
import type { OrderReconciliationState, TransactionScene } from "./order";

export type SplitInstructionStatus =
  | "PENDING"
  | "PROCESSING"
  | "PARTIAL"
  | "SUCCESS"
  | "FAILED"
  | "REVERSING"
  | "REVERSED";

export interface SplitInstruction extends BaseRecord {
  splitInstructionNo: string;
  orderId: string;
  merchantId: string;
  shopId: string;
  transactionScene: TransactionScene;
  profileSnapshotId: string;
  profileVersion: number;
  allocationBase: Cents;
  merchantAmount: Cents;
  platformAmount: Cents;
  channelFeeAmount: Cents;
  rewardPointCashEquivalent: Cents;
  roundingAmount: Cents;
  settlementEligibleAt: string;
  scheduledSettlementDate: string;
  idempotentKey: string;
  attemptCount: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  status: SplitInstructionStatus;
  reconciliationStatus: OrderReconciliationState;
  createdAt: string;
}

export type MerchantSettlementStatus =
  | "SCHEDULED"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REVERSING"
  | "REVERSED"
  | "UNCONFIRMED";

export interface MerchantSettlement extends BaseRecord {
  settlementNo: string;
  merchantId: string;
  shopId: string;
  splitInstructionIds: string[];
  periodStart: string;
  periodEnd: string;
  scheduledSettlementDate: string;
  merchantReceivableAmount: Cents;
  adjustmentAmount: Cents;
  actualPaidAmount: Cents;
  status: MerchantSettlementStatus;
  idempotentKey: string;
  reconciliationStatus: OrderReconciliationState;
  lastErrorMessage: string | null;
  createdAt: string;
}
