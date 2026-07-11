import type { BaseRecord, Cents } from "./base";
import type { OrderReconciliationState } from "./order";

export type FundingPoolType = "POINT" | "COUPON";
export type FundingCustodianType = "PLATFORM" | "BANK" | "THIRD_PARTY" | "UNCONFIRMED";
export type CouponFundingMode = "PREPAID" | "ADVANCE_REIMBURSEMENT" | "UNCONFIRMED";
export type OverIssuePolicy = boolean | "UNCONFIRMED";
export type FundingPoolStatus = "ACTIVE" | "WARNING" | "FROZEN" | "UNCONFIRMED";

export interface FundingPool extends BaseRecord {
  poolCode: string;
  type: FundingPoolType;
  ownerId: string;
  ownerName: string;
  custodianType: FundingCustodianType;
  couponFundingMode: CouponFundingMode | null;
  cashBalance: Cents;
  issuedLiability: Cents;
  occupiedAmount: Cents;
  settledAmount: Cents;
  warningThreshold: Cents;
  allowOverIssue: OverIssuePolicy;
  status: FundingPoolStatus;
  reconciliationStatus: OrderReconciliationState;
}

export type FundingPoolEntryType = "RECHARGE" | "ISSUE" | "OCCUPY" | "RELEASE" | "SETTLE" | "ADJUST";

export interface FundingPoolEntry extends BaseRecord {
  poolId: string;
  entryType: FundingPoolEntryType;
  direction: "CREDIT" | "DEBIT";
  amount: Cents;
  cashBalanceBefore: Cents;
  cashBalanceAfter: Cents;
  occupiedBefore: Cents;
  occupiedAfter: Cents;
  businessReference: string;
  idempotentKey: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
  auditRecordId: string;
  reconciliationStatus: OrderReconciliationState;
  createdAt: string;
}
