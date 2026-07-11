// 账务领域 — LedgerEntry

import type { BaseRecord } from "./base";

// ============================================================
// 记账分录
// ============================================================
export type LedgerType =
  | "PAYMENT_RECEIVABLE"
  | "MERCHANT_PAYABLE"
  | "PLATFORM_REVENUE"
  | "CHANNEL_FEE"
  | "REWARD_POINT_LIABILITY"
  | "POINT_POOL"
  | "COUPON_POOL";

export const LedgerTypeLabel: Record<LedgerType, string> = {
  PAYMENT_RECEIVABLE: "支付应收",
  MERCHANT_PAYABLE: "商户应付",
  PLATFORM_REVENUE: "平台收益",
  CHANNEL_FEE: "渠道费",
  REWARD_POINT_LIABILITY: "返积分责任",
  POINT_POOL: "积分资金池",
  COUPON_POOL: "消费券资金池",
};

export type LedgerDirection = "借" | "贷";

export interface LedgerEntry extends BaseRecord {
  entryId: string;               // 分录 ID
  orderId: string;               // 关联订单
  paymentId: string;             // 关联支付单
  type: LedgerType;              // 现金 / 补贴
  direction: LedgerDirection;    // 借 / 贷
  amount: number;                // 金额（分）
  description: string;           // 摘要
  idempotentKey: string;
  auditRecordId: string;
  reconciliationStatus: "NOT_STARTED" | "MATCHED" | "MISMATCH" | "RESOLVED";
  createdAt: string;
}
