// 消费券领域 — CouponTemplate / UserCoupon

import type { BaseRecord, Cents } from "./base";
import type { CouponFundingMode } from "./funding";
import type { OrderReconciliationState } from "./order";

// ============================================================
// 消费券类型
// ============================================================
export type CouponType = "FIXED" | "PERCENTAGE";

export const CouponTypeLabel: Record<CouponType, string> = {
  "FIXED": "固定金额",
  "PERCENTAGE": "百分比",
};

// ============================================================
// CouponTemplate（券模板）— 平台运营方创建
// ============================================================
export interface CouponTemplate extends BaseRecord {
  templateId: string;            // 模板 ID
  name: string;                  // 券名称（如"满500减100"）
  type: CouponType;              // 固定金额 / 百分比
  value: number;                 // 固定金额的数值（分） or 百分比（如20表示8折）
  minAmount: number;             // 最低消费门槛（分），0=无门槛
  maxDiscount: number;           // 最大抵扣上限（分），0=无上限；百分比券专用
  validFrom: string;             // 有效期开始
  validTo: string;               // 有效期结束
  totalCount: number;            // 发放总量
  usedCount: number;             // 已使用数量
  description: string;           // 使用说明
  status: "启用" | "停用";
}

// ============================================================
// 用户券状态
// ============================================================
export type UserCouponStatus = "未使用" | "已锁定" | "已使用" | "已过期";

export const UserCouponStatusColor: Record<UserCouponStatus, string> = {
  "未使用": "blue",
  "已锁定": "orange",
  "已使用": "default",
  "已过期": "default",
};

// ============================================================
// UserCoupon（用户持有的消费券）
// ============================================================
export interface UserCoupon extends BaseRecord {
  couponId: string;              // 用户券 ID
  userId: string;                // 用户
  templateId: string;            // 券模板
  templateName: string;          // 券名称（冗余）
  type: CouponType;              // 冗余
  value: number;                 // 冗余
  minAmount: number;             // 冗余
  maxDiscount: number;           // 冗余
  status: UserCouponStatus;      // 未使用 / 已锁定 / 已使用 / 已过期
  lockedAt: string;              // 锁定时间（支付时）
  usedAt: string;                // 使用时间（支付成功）
  usedOrderId: string;           // 使用的订单 ID
  source: string;                // 来源（活动/系统发放）
  expiredAt: string;             // 过期时间
}

export interface CouponFundingBatch extends BaseRecord {
  batchNo: string;
  fundingPoolId: string;
  issuerId: string;
  issuerName: string;
  responsibilityMode: CouponFundingMode;
  rechargeAmount: Cents;
  issuedLiability: Cents;
  redeemedOccupiedAmount: Cents;
  merchantReceivableAmount: Cents;
  settledAmount: Cents;
  differenceAmount: Cents;
  reconciliationStatus: OrderReconciliationState;
  idempotentKey: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "UNCONFIRMED";
}
