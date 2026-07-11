// services/deduction.ts — 抵扣计算引擎类型定义

import type { UserCoupon } from "../domain";

// ============================================================
// 抵扣计算接口（只定义类型，不写业务逻辑函数体）
// 规则来自双循环 grilling 共识：
//   - 单券制：选抵扣最多的那张
//   - 先券后分：券抵扣 → 积分抵扣 → 实付
// ============================================================

export interface DeductionInput {
  totalAmount: number;       // 挂牌价（分）
  userId: string;            // 用户
  shopId: string;            // 店铺
}

export interface AvailableCoupon {
  couponId: string;
  templateName: string;
  type: "FIXED" | "PERCENTAGE";
  deductionAmount: number;   // 若选此券可抵扣金额（分）
  originValue: number;       // 券面值（分 or 百分比）
}

export interface DeductionBreakdown {
  originalAmount: number;    // 挂牌价
  couponDeduction: number;   // 券抵扣
  coinDeduction: number;     // 积分抵扣
  finalAmount: number;       // 实付
}

export interface DeductionResult {
  availableCoupons: AvailableCoupon[];
  recommendedCouponId: string | null;
  maxCoinCanUse: number;     // 用户最多可用积分
  coinToAmount: number;      // 积分折算金额（1积分=1分）
  breakdown: DeductionBreakdown;
}

// ============================================================
// Mock 抵扣计算（localStorage 数据驱动）
// ============================================================

function calcDeductionForCoupon(
  coupon: UserCoupon,
  totalAmount: number
): number {
  if (totalAmount < coupon.minAmount) return 0;
  if (coupon.type === "FIXED") {
    return Math.min(coupon.value, coupon.maxDiscount || coupon.value);
  }
  // PERCENTAGE
  const raw = Math.floor(totalAmount * (coupon.value / 100));
  return Math.min(raw, coupon.maxDiscount || raw);
}

export function calculateDeduction(
  input: DeductionInput,
  availableCoupons: UserCoupon[],
  coinBalance: number
): DeductionResult {
  const { totalAmount } = input;

  const couponOptions: AvailableCoupon[] = availableCoupons
    .filter((c) => c.status === "未使用")
    .map((c) => ({
      couponId: c.couponId,
      templateName: c.templateName,
      type: c.type,
      deductionAmount: calcDeductionForCoupon(c, totalAmount),
      originValue: c.value,
    }))
    .filter((c) => c.deductionAmount > 0)
    .sort((a, b) => b.deductionAmount - a.deductionAmount);

  const recommended = couponOptions[0] || null;
  const couponDeduction = recommended ? recommended.deductionAmount : 0;
  const afterCoupon = totalAmount - couponDeduction;

  // 积分最多抵扣到不使实付为负，1积分=1分
  const maxCoinCanUse = Math.min(coinBalance, Math.max(0, afterCoupon));
  const coinDeduction = maxCoinCanUse;
  const finalAmount = afterCoupon - coinDeduction;

  return {
    availableCoupons: couponOptions,
    recommendedCouponId: recommended?.couponId ?? null,
    maxCoinCanUse,
    coinToAmount: maxCoinCanUse,
    breakdown: {
      originalAmount: totalAmount,
      couponDeduction,
      coinDeduction,
      finalAmount,
    },
  };
}
