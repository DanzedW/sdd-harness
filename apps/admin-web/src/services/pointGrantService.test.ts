import { describe, expect, it } from "vitest";
import type { FundingPool } from "../domain";
import { createFundingPoolService } from "./fundingPoolService";
import { createPointGrantService, hashPhoneForMock } from "./pointGrantService";

const registeredPhone = "138" + "0000" + "0001";
const pendingPhone = "139" + "0000" + "0002";

function createServices(cashBalance = 10_000) {
  const pool: FundingPool = {
    id: "pool-point",
    poolCode: "POINT-001",
    type: "POINT",
    ownerId: "org-1",
    ownerName: "示例机构",
    custodianType: "UNCONFIRMED",
    couponFundingMode: null,
    cashBalance,
    issuedLiability: 0,
    occupiedAmount: 0,
    settledAmount: 0,
    warningThreshold: 1_000,
    allowOverIssue: false,
    status: "ACTIVE",
    reconciliationStatus: "NOT_STARTED",
    updatedAt: "2026-07-01 00:00:00",
  };
  const fundingPoolService = createFundingPoolService({ pools: [pool] });
  const pointGrantService = createPointGrantService({
    fundingPoolService,
    registeredUsers: [{ phoneHash: hashPhoneForMock(registeredPhone), userId: "user-1" }],
  });
  return { fundingPoolService, pointGrantService };
}

describe("point grant batch and pending claim", () => {
  it("prevalidates rows, executes valid rows once and outputs failure details", () => {
    const { pointGrantService } = createServices();
    const preview = pointGrantService.previewBatch({
      fundingPoolId: "pool-point",
      sourceOrganizationId: "org-1",
      sourceOrganizationName: "示例机构",
      fileName: "grant-demo.xlsx",
      idempotentKey: "upload:demo-1",
      rows: [
        { recipientName: "王*", phone: registeredPhone, pointAmount: 500, cashEquivalent: 500 },
        { recipientName: "李*", phone: pendingPhone, pointAmount: 300, cashEquivalent: 300 },
        { recipientName: "错误行", phone: "123", pointAmount: 100, cashEquivalent: 100 },
      ],
    });
    expect(preview.batch.validCount).toBe(2);
    expect(preview.batch.failedCount).toBe(1);
    expect(preview.details[2].failureReason).toContain("phone");

    pointGrantService.approveBatch(preview.batch.id, "operator-1");
    const executed = pointGrantService.executeBatch(preview.batch.id, "execute:demo-1");
    expect(executed.batch.status).toBe("PARTIAL");
    expect(executed.details.map((detail) => detail.status)).toEqual([
      "POSTED",
      "PENDING_CLAIM",
      "INVALID",
    ]);
    expect(pointGrantService.listPendingAccounts()).toHaveLength(1);
    expect(JSON.stringify(pointGrantService.exportState())).not.toContain(registeredPhone);
    expect(JSON.stringify(pointGrantService.exportState())).not.toContain(pendingPhone);

    const repeated = pointGrantService.executeBatch(preview.batch.id, "execute:demo-1");
    expect(repeated).toEqual(executed);
    expect(pointGrantService.listLedgerEntries()).toHaveLength(1);
  });

  it("allows only the matching verified phone hash to claim once", () => {
    const { pointGrantService } = createServices();
    const preview = pointGrantService.previewBatch({
      fundingPoolId: "pool-point",
      sourceOrganizationId: "org-1",
      sourceOrganizationName: "示例机构",
      fileName: "pending.xlsx",
      idempotentKey: "upload:pending",
      rows: [{ recipientName: "李*", phone: pendingPhone, pointAmount: 300, cashEquivalent: 300 }],
    });
    pointGrantService.approveBatch(preview.batch.id, "operator-1");
    pointGrantService.executeBatch(preview.batch.id, "execute:pending");
    const pending = pointGrantService.listPendingAccounts()[0];

    expect(() =>
      pointGrantService.claimPending({
        pendingAccountId: pending.id,
        verifiedPhone: registeredPhone,
        userId: "user-2",
        idempotentKey: "claim:wrong",
      }),
    ).toThrow("verified phone does not match");

    const claimed = pointGrantService.claimPending({
      pendingAccountId: pending.id,
      verifiedPhone: pendingPhone,
      userId: "user-2",
      idempotentKey: "claim:ok",
    });
    const repeated = pointGrantService.claimPending({
      pendingAccountId: pending.id,
      verifiedPhone: pendingPhone,
      userId: "user-2",
      idempotentKey: "claim:ok",
    });
    expect(claimed.account.status).toBe("CLAIMED");
    expect(repeated.ledgerEntry.id).toBe(claimed.ledgerEntry.id);
  });

  it("blocks a batch when the point pool cannot fund valid rows", () => {
    const { pointGrantService } = createServices(100);
    const preview = pointGrantService.previewBatch({
      fundingPoolId: "pool-point",
      sourceOrganizationId: "org-1",
      sourceOrganizationName: "示例机构",
      fileName: "insufficient.xlsx",
      idempotentKey: "upload:insufficient",
      rows: [{ recipientName: "王*", phone: registeredPhone, pointAmount: 500, cashEquivalent: 500 }],
    });
    pointGrantService.approveBatch(preview.batch.id, "operator-1");
    const executed = pointGrantService.executeBatch(preview.batch.id, "execute:insufficient");
    expect(executed.batch.status).toBe("PARTIAL");
    expect(executed.details[0].status).toBe("FAILED");
    expect(executed.details[0].failureReason).toContain("insufficient");
  });
});

describe("point use and transaction reward", () => {
  it("moves used point responsibility into occupied funds", () => {
    const { fundingPoolService, pointGrantService } = createServices();
    fundingPoolService.issue({
      poolId: "pool-point",
      amount: 500,
      businessReference: "opening-user-1",
      idempotentKey: "opening:user-1",
      operatorId: "mock-system",
    });
    const used = pointGrantService.usePoints({
      fundingPoolId: "pool-point",
      userId: "user-1",
      orderId: "order-use-1",
      pointAmount: 200,
      cashEquivalent: 200,
      balanceBefore: 500,
      idempotentKey: "point-use:order-use-1",
    });
    expect(used.ledgerEntry.direction).toBe("DEBIT");
    expect(used.pool.occupiedAmount).toBe(200);
    expect(used.pool.issuedLiability).toBe(300);
  });

  it("rewards offline payment success and online fulfillment completion only", () => {
    const { pointGrantService } = createServices();
    const offline = pointGrantService.rewardTransaction({
      fundingPoolId: "pool-point",
      orderId: "offline-1",
      userId: "user-1",
      profileSnapshotId: "profile-1-v1",
      transactionScene: "OFFLINE",
      paymentState: "SUCCESS",
      fulfillmentState: "NOT_REQUIRED",
      calculationBase: 10_000,
      rewardRateBps: 100,
      pointAmount: 100,
      cashEquivalent: 100,
      idempotentKey: "reward:offline-1",
    });
    expect(offline.reward.triggerType).toBe("PAYMENT_SUCCESS");

    expect(() =>
      pointGrantService.rewardTransaction({
        fundingPoolId: "pool-point",
        orderId: "online-waiting",
        userId: "user-1",
        profileSnapshotId: "profile-1-v1",
        transactionScene: "ONLINE",
        paymentState: "SUCCESS",
        fulfillmentState: "IN_PROGRESS",
        calculationBase: 10_000,
        rewardRateBps: 100,
        pointAmount: 100,
        cashEquivalent: 100,
        idempotentKey: "reward:online-waiting",
      }),
    ).toThrow("not eligible");

    const online = pointGrantService.rewardTransaction({
      fundingPoolId: "pool-point",
      orderId: "online-complete",
      userId: "user-1",
      profileSnapshotId: "profile-1-v1",
      transactionScene: "ONLINE",
      paymentState: "SUCCESS",
      fulfillmentState: "COMPLETED",
      calculationBase: 10_000,
      rewardRateBps: 100,
      pointAmount: 100,
      cashEquivalent: 100,
      idempotentKey: "reward:online-complete",
    });
    expect(online.reward.triggerType).toBe("FULFILLMENT_COMPLETED");
  });
});
