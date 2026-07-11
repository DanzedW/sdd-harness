import { describe, expect, it } from "vitest";
import type { FundingPool } from "../domain";
import { createFundingPoolService } from "./fundingPoolService";

function pointPool(overIssue: FundingPool["allowOverIssue"] = false): FundingPool {
  return {
    id: "pool-point",
    poolCode: "POINT-001",
    type: "POINT",
    ownerId: "org-1",
    ownerName: "示例机构",
    custodianType: "UNCONFIRMED",
    couponFundingMode: null,
    cashBalance: 1_000,
    issuedLiability: 600,
    occupiedAmount: 200,
    settledAmount: 0,
    warningThreshold: 300,
    allowOverIssue: overIssue,
    status: "ACTIVE",
    reconciliationStatus: "NOT_STARTED",
    updatedAt: "2026-07-01 00:00:00",
  };
}

describe("funding pool service", () => {
  it("recharges, occupies, releases and settles with idempotent entries and audits", () => {
    const service = createFundingPoolService({ pools: [pointPool()] });
    const recharge = service.recharge({
      poolId: "pool-point",
      amount: 500,
      businessReference: "recharge-1",
      idempotentKey: "recharge:1",
      operatorId: "operator-1",
    });
    expect(recharge.pool.cashBalance).toBe(1_500);

    const occupied = service.occupy({
      poolId: "pool-point",
      amount: 100,
      businessReference: "order-1",
      idempotentKey: "occupy:1",
      operatorId: "mock-system",
    });
    expect(occupied.pool.issuedLiability).toBe(500);
    expect(occupied.pool.occupiedAmount).toBe(300);

    const repeated = service.occupy({
      poolId: "pool-point",
      amount: 100,
      businessReference: "order-1",
      idempotentKey: "occupy:1",
      operatorId: "mock-system",
    });
    expect(repeated.entry.id).toBe(occupied.entry.id);
    expect(repeated.pool.occupiedAmount).toBe(300);

    const released = service.release({
      poolId: "pool-point",
      amount: 50,
      businessReference: "order-1",
      idempotentKey: "release:1",
      operatorId: "operator-1",
    });
    expect(released.pool.issuedLiability).toBe(550);
    expect(released.pool.occupiedAmount).toBe(250);

    const settled = service.settle({
      poolId: "pool-point",
      amount: 200,
      businessReference: "settlement-1",
      idempotentKey: "settle:1",
      operatorId: "mock-system",
    });
    expect(settled.pool.cashBalance).toBe(1_300);
    expect(settled.pool.occupiedAmount).toBe(50);
    expect(settled.pool.settledAmount).toBe(200);
    expect(service.listAuditRecords()).toHaveLength(4);
  });

  it("blocks issuance when balance is insufficient and over-issue is disabled", () => {
    const service = createFundingPoolService({ pools: [pointPool(false)] });
    expect(() =>
      service.issue({
        poolId: "pool-point",
        amount: 201,
        businessReference: "grant-1",
        idempotentKey: "issue:blocked",
        operatorId: "operator-1",
      }),
    ).toThrow("insufficient available balance");
    expect(service.getPool("pool-point").issuedLiability).toBe(600);
  });

  it("allows configured over-issue but returns a visible risk flag", () => {
    const service = createFundingPoolService({ pools: [pointPool(true)] });
    const result = service.issue({
      poolId: "pool-point",
      amount: 201,
      businessReference: "grant-1",
      idempotentKey: "issue:risk",
      operatorId: "operator-1",
    });
    expect(result.risk).toBe("OVER_ISSUE");
    expect(result.pool.status).toBe("WARNING");
  });

  it("refuses to execute an unconfirmed over-issue policy", () => {
    const service = createFundingPoolService({ pools: [pointPool("UNCONFIRMED")] });
    expect(() =>
      service.issue({
        poolId: "pool-point",
        amount: 1,
        businessReference: "grant-1",
        idempotentKey: "issue:unconfirmed",
        operatorId: "operator-1",
      }),
    ).toThrow("over-issue policy is unconfirmed");
  });
});
