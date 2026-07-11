import { describe, expect, it } from "vitest";
import type { MerchantSettlementProfile } from "../domain";
import {
  assertSplitConservation,
  assertValidBasisPoints,
  assertValidCents,
  calculateSettlementDate,
  evaluateSettlementEligibility,
  snapshotSettlementProfile,
} from "./settlementRules";

const profile: MerchantSettlementProfile = {
  id: "profile-1",
  merchantId: "merchant-1",
  shopId: "shop-1",
  version: 1,
  merchantRateBps: 9000,
  platformRateBps: 300,
  channelFeeRateBps: 30,
  rewardPointRateBps: 670,
  rewardBaseType: "GROSS",
  settlementCycleType: "T_PLUS_1",
  settlementDays: 1,
  onlineEnabled: true,
  offlineEnabled: true,
  effectiveFrom: "2026-06-01",
  effectiveTo: null,
  status: "ACTIVE",
  updatedAt: "2026-06-01 00:00:00",
};

describe("financial primitive guards", () => {
  it("accepts integer cents and basis points", () => {
    expect(assertValidCents(10_000)).toBe(10_000);
    expect(assertValidBasisPoints(6_700)).toBe(6_700);
  });

  it("rejects fractional or negative cents", () => {
    expect(() => assertValidCents(1.2)).toThrow("integer cents");
    expect(() => assertValidCents(-1)).toThrow("non-negative");
  });

  it("rejects basis points outside the integer 0-10000 range", () => {
    expect(() => assertValidBasisPoints(100.5)).toThrow("integer basis points");
    expect(() => assertValidBasisPoints(10_001)).toThrow("between 0 and 10000");
  });
});

describe("split conservation", () => {
  it("accepts the 100 yuan 90/3/6.7/0.3 allocation", () => {
    expect(() =>
      assertSplitConservation({
        allocationBase: 10_000,
        merchantAmount: 9_000,
        platformAmount: 300,
        channelFeeAmount: 30,
        rewardPointCashEquivalent: 670,
        roundingAmount: 0,
      }),
    ).not.toThrow();
  });

  it("rejects a one-cent mismatch", () => {
    expect(() =>
      assertSplitConservation({
        allocationBase: 10_000,
        merchantAmount: 9_000,
        platformAmount: 300,
        channelFeeAmount: 30,
        rewardPointCashEquivalent: 669,
        roundingAmount: 0,
      }),
    ).toThrow("must equal allocation base");
  });
});

describe("merchant profile snapshot and cycle", () => {
  it("keeps a transaction snapshot unchanged when the source profile changes", () => {
    const snapshot = snapshotSettlementProfile(profile);
    profile.platformRateBps = 500;
    expect(snapshot.platformRateBps).toBe(300);
    profile.platformRateBps = 300;
  });

  it("calculates different T+1 and T+3 dates", () => {
    expect(calculateSettlementDate("2026-06-30", profile)).toBe("2026-07-01");
    expect(
      calculateSettlementDate("2026-06-30", {
        ...profile,
        settlementCycleType: "T_PLUS_N",
        settlementDays: 3,
      }),
    ).toBe("2026-07-03");
  });

  it("does not invent a date for an unconfirmed cycle", () => {
    expect(() =>
      calculateSettlementDate("2026-06-30", {
        ...profile,
        settlementCycleType: "UNCONFIRMED",
      }),
    ).toThrow("unconfirmed");
  });
});

describe("online and offline settlement eligibility", () => {
  it("keeps a paid online order ineligible before fulfillment", () => {
    expect(
      evaluateSettlementEligibility({
        transactionScene: "ONLINE",
        paymentState: "SUCCESS",
        fulfillmentState: "IN_PROGRESS",
      }),
    ).toBe("WAITING_FULFILLMENT");
  });

  it("makes a paid and fulfilled online order eligible", () => {
    expect(
      evaluateSettlementEligibility({
        transactionScene: "ONLINE",
        paymentState: "SUCCESS",
        fulfillmentState: "COMPLETED",
      }),
    ).toBe("ELIGIBLE");
  });

  it("makes an offline transaction eligible only after payment succeeds", () => {
    expect(
      evaluateSettlementEligibility({
        transactionScene: "OFFLINE",
        paymentState: "FAILED",
        fulfillmentState: "NOT_REQUIRED",
      }),
    ).toBe("WAITING_PAYMENT");
    expect(
      evaluateSettlementEligibility({
        transactionScene: "OFFLINE",
        paymentState: "SUCCESS",
        fulfillmentState: "NOT_REQUIRED",
      }),
    ).toBe("ELIGIBLE");
  });

  it("blocks eligibility when legacy transaction facts are unconfirmed", () => {
    expect(
      evaluateSettlementEligibility({
        transactionScene: "UNCONFIRMED",
        paymentState: "UNCONFIRMED",
        fulfillmentState: "UNCONFIRMED",
      }),
    ).toBe("BLOCKED");
  });
});
