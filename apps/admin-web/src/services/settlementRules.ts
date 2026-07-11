import type {
  BasisPoints,
  Cents,
  FulfillmentState,
  MerchantSettlementProfile,
  MerchantSettlementProfileSnapshot,
  PaymentState,
  SettlementEligibilityState,
  TransactionScene,
} from "../domain";

export interface SplitConservationInput {
  allocationBase: Cents;
  merchantAmount: Cents;
  platformAmount: Cents;
  channelFeeAmount: Cents;
  rewardPointCashEquivalent: Cents;
  roundingAmount: Cents;
}

export interface SettlementEligibilityInput {
  transactionScene: TransactionScene;
  paymentState: PaymentState;
  fulfillmentState: FulfillmentState;
}

export function assertValidCents(value: number, fieldName = "amount"): Cents {
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must use integer cents`);
  }
  if (value < 0) {
    throw new Error(`${fieldName} must be non-negative`);
  }
  return value;
}

export function assertValidBasisPoints(value: number, fieldName = "rate"): BasisPoints {
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must use integer basis points`);
  }
  if (value < 0 || value > 10_000) {
    throw new Error(`${fieldName} must be between 0 and 10000 basis points`);
  }
  return value;
}

export function assertSplitConservation(input: SplitConservationInput): void {
  assertValidCents(input.allocationBase, "allocationBase");
  assertValidCents(input.merchantAmount, "merchantAmount");
  assertValidCents(input.platformAmount, "platformAmount");
  assertValidCents(input.channelFeeAmount, "channelFeeAmount");
  assertValidCents(input.rewardPointCashEquivalent, "rewardPointCashEquivalent");
  if (!Number.isInteger(input.roundingAmount)) {
    throw new Error("roundingAmount must use integer cents");
  }
  const allocated =
    input.merchantAmount +
    input.platformAmount +
    input.channelFeeAmount +
    input.rewardPointCashEquivalent +
    input.roundingAmount;
  if (allocated !== input.allocationBase) {
    throw new Error(`allocated amount ${allocated} must equal allocation base ${input.allocationBase}`);
  }
}

export function snapshotSettlementProfile(
  profile: MerchantSettlementProfile,
): MerchantSettlementProfileSnapshot {
  return Object.freeze({ ...profile });
}

export function calculateSettlementDate(
  transactionDate: string,
  profile: MerchantSettlementProfile,
): string {
  if (profile.settlementCycleType === "UNCONFIRMED") {
    throw new Error("settlement cycle is unconfirmed");
  }
  const days = profile.settlementCycleType === "T_PLUS_1" ? 1 : profile.settlementDays;
  if (!Number.isInteger(days) || (days ?? 0) < 1) {
    throw new Error("settlement days must be a positive integer");
  }
  const date = new Date(`${transactionDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("transaction date must be a valid YYYY-MM-DD value");
  }
  date.setUTCDate(date.getUTCDate() + (days as number));
  return date.toISOString().slice(0, 10);
}

export function evaluateSettlementEligibility(
  input: SettlementEligibilityInput,
): SettlementEligibilityState {
  if (
    input.transactionScene === "UNCONFIRMED" ||
    input.paymentState === "UNCONFIRMED" ||
    input.fulfillmentState === "UNCONFIRMED"
  ) {
    return "BLOCKED";
  }
  if (input.paymentState !== "SUCCESS") {
    return "WAITING_PAYMENT";
  }
  if (input.transactionScene === "ONLINE" && input.fulfillmentState !== "COMPLETED") {
    return "WAITING_FULFILLMENT";
  }
  return "ELIGIBLE";
}
