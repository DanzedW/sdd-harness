// 积分领域 — CoinRecord

import type { BaseRecord, BasisPoints, Cents } from "./base";
import type { OrderReconciliationState } from "./order";

// ============================================================
// 积分流水
// ============================================================
export type CoinDirection = "获取" | "消耗";

export const CoinDirectionColor: Record<CoinDirection, string> = {
  "获取": "green",
  "消耗": "red",
};

export interface CoinRecord extends BaseRecord {
  recordId: string;              // 流水 ID
  userId: string;                // 用户
  amount: number;                // 积分数量
  direction: CoinDirection;      // 获取 / 消耗
  source: string;                // 来源描述（如"商城消费抵扣"、"物业缴费赠送"）
  orderId: string | null;        // 关联订单（消耗时必填，获取时可选）
  balanceBefore: number;         // 变动前余额
  balanceAfter: number;          // 变动后余额
  createdAt: string;
}

export type PointGrantSourceType = "ORGANIZATION" | "TRANSACTION_REWARD" | "MANUAL_ADJUSTMENT";
export type PointGrantBatchStatus =
  | "VALIDATING"
  | "PENDING_APPROVAL"
  | "PROCESSING"
  | "PARTIAL"
  | "SUCCESS"
  | "REVOKED";

export interface PointGrantBatch extends BaseRecord {
  batchNo: string;
  sourceType: PointGrantSourceType;
  sourceOrganizationId: string | null;
  sourceOrganizationName: string | null;
  fundingPoolId: string;
  fileName: string;
  totalCount: number;
  validCount: number;
  failedCount: number;
  totalPoints: number;
  idempotentKey: string;
  status: PointGrantBatchStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  executedAt: string | null;
}

export interface PointGrantDetail extends BaseRecord {
  batchId: string;
  rowNumber: number;
  recipientName: string;
  phoneMasked: string;
  phoneHash: string;
  userId: string | null;
  pointAmount: number;
  cashEquivalent: Cents;
  status: "VALID" | "INVALID" | "POSTED" | "PENDING_CLAIM" | "FAILED";
  failureReason: string | null;
}

export interface PendingPointAccount extends BaseRecord {
  phoneMasked: string;
  phoneHash: string;
  grantDetailId: string;
  pointAmount: number;
  cashEquivalent: Cents;
  status: "PENDING" | "CLAIMED" | "EXPIRED" | "REVOKED";
  claimedUserId: string | null;
  claimedAt: string | null;
  expiresAt: string | null;
}

export interface PointLedgerEntry extends BaseRecord {
  userId: string;
  direction: "CREDIT" | "DEBIT" | "FREEZE" | "UNFREEZE" | "RECLAIM";
  businessType: "ORGANIZATION_GRANT" | "TRANSACTION_REWARD" | "POINT_USE" | "MANUAL_ADJUSTMENT";
  pointAmount: number;
  cashEquivalent: Cents;
  balanceBefore: number;
  balanceAfter: number;
  orderId: string | null;
  fundingPoolId: string;
  idempotentKey: string;
  status: "PENDING" | "POSTED" | "FAILED" | "REVERSED";
  reconciliationStatus: OrderReconciliationState;
  createdAt: string;
}

export interface RewardPointRecord extends BaseRecord {
  orderId: string;
  userId: string;
  profileSnapshotId: string;
  calculationBase: Cents;
  rewardRateBps: BasisPoints;
  pointAmount: number;
  cashEquivalent: Cents;
  triggerType: "PAYMENT_SUCCESS" | "FULFILLMENT_COMPLETED" | "MANUAL" | "UNCONFIRMED";
  status: "PENDING" | "GRANTED" | "FROZEN" | "RECLAIM_PENDING" | "RECLAIMED" | "RECLAIM_FAILED";
  idempotentKey: string;
  lastErrorMessage: string | null;
}
