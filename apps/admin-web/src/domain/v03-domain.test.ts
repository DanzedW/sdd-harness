import { describe, expect, it } from "vitest";
import type {
  AuditRecord,
  CouponFundingBatch,
  FundingPool,
  FundingPoolEntry,
  MerchantSettlement,
  PendingPointAccount,
  PointGrantBatch,
  PointGrantDetail,
  PointLedgerEntry,
  ReconciliationRecord,
  RewardPointRecord,
  SplitInstruction,
} from "./index";

describe("V0.3 financial domain contracts", () => {
  it("represents a conserved multi-party split with retry and reconciliation state", () => {
    const split: SplitInstruction = {
      id: "split-1",
      splitInstructionNo: "SPLIT-20260630-001",
      orderId: "order-1",
      merchantId: "merchant-1",
      shopId: "shop-1",
      transactionScene: "OFFLINE",
      profileSnapshotId: "profile-1-v1",
      profileVersion: 1,
      allocationBase: 10_000,
      merchantAmount: 9_000,
      platformAmount: 300,
      channelFeeAmount: 30,
      rewardPointCashEquivalent: 670,
      roundingAmount: 0,
      settlementEligibleAt: "2026-06-30 10:00:00",
      scheduledSettlementDate: "2026-07-01",
      idempotentKey: "split:order-1:v1",
      attemptCount: 1,
      lastErrorCode: null,
      lastErrorMessage: null,
      status: "PARTIAL",
      reconciliationStatus: "MISMATCH",
      updatedAt: "2026-06-30 10:01:00",
      createdAt: "2026-06-30 10:00:00",
    };
    expect(
      split.merchantAmount +
        split.platformAmount +
        split.channelFeeAmount +
        split.rewardPointCashEquivalent +
        split.roundingAmount,
    ).toBe(split.allocationBase);
  });

  it("models POINT and COUPON pools without choosing unconfirmed custody rules", () => {
    const pools: FundingPool[] = [
      {
        id: "pool-point",
        poolCode: "POINT-POOL-001",
        type: "POINT",
        ownerId: "org-1",
        ownerName: "示例机构",
        custodianType: "UNCONFIRMED",
        couponFundingMode: null,
        cashBalance: 100_000,
        issuedLiability: 50_000,
        occupiedAmount: 10_000,
        settledAmount: 5_000,
        warningThreshold: 20_000,
        allowOverIssue: "UNCONFIRMED",
        status: "ACTIVE",
        reconciliationStatus: "NOT_STARTED",
        updatedAt: "2026-06-30 10:00:00",
      },
      {
        id: "pool-coupon",
        poolCode: "COUPON-POOL-001",
        type: "COUPON",
        ownerId: "issuer-1",
        ownerName: "示例发券机构",
        custodianType: "THIRD_PARTY",
        couponFundingMode: "UNCONFIRMED",
        cashBalance: 200_000,
        issuedLiability: 80_000,
        occupiedAmount: 20_000,
        settledAmount: 10_000,
        warningThreshold: 30_000,
        allowOverIssue: false,
        status: "WARNING",
        reconciliationStatus: "MISMATCH",
        updatedAt: "2026-06-30 10:00:00",
      },
    ];
    expect(pools.map((pool) => pool.type)).toEqual(["POINT", "COUPON"]);
  });

  it("models idempotent point grant, masked pending claim and reward records", () => {
    const batch: PointGrantBatch = {
      id: "batch-1",
      batchNo: "PGB-001",
      sourceType: "ORGANIZATION",
      sourceOrganizationId: "org-1",
      sourceOrganizationName: "示例机构",
      fundingPoolId: "pool-point",
      fileName: "grant-demo.xlsx",
      totalCount: 2,
      validCount: 1,
      failedCount: 1,
      totalPoints: 1_000,
      idempotentKey: "grant:sha256-demo",
      status: "PARTIAL",
      approvedBy: "operator-1",
      approvedAt: "2026-06-30 10:00:00",
      executedAt: "2026-06-30 10:01:00",
      updatedAt: "2026-06-30 10:01:00",
    };
    const detail: PointGrantDetail = {
      id: "detail-1",
      batchId: batch.id,
      rowNumber: 2,
      recipientName: "王*",
      phoneMasked: "138****0001",
      phoneHash: "sha256:demo-1",
      userId: null,
      pointAmount: 1_000,
      cashEquivalent: 1_000,
      status: "PENDING_CLAIM",
      failureReason: null,
      updatedAt: "2026-06-30 10:01:00",
    };
    const pending: PendingPointAccount = {
      id: "pending-1",
      phoneMasked: detail.phoneMasked,
      phoneHash: detail.phoneHash,
      grantDetailId: detail.id,
      pointAmount: detail.pointAmount,
      cashEquivalent: detail.cashEquivalent,
      status: "PENDING",
      claimedUserId: null,
      claimedAt: null,
      expiresAt: null,
      updatedAt: "2026-06-30 10:01:00",
    };
    const ledger: PointLedgerEntry = {
      id: "point-entry-1",
      userId: "user-1",
      direction: "CREDIT",
      businessType: "TRANSACTION_REWARD",
      pointAmount: 670,
      cashEquivalent: 670,
      balanceBefore: 0,
      balanceAfter: 670,
      orderId: "order-1",
      fundingPoolId: "pool-point",
      idempotentKey: "reward:order-1:user-1",
      status: "POSTED",
      reconciliationStatus: "NOT_STARTED",
      createdAt: "2026-06-30 10:00:00",
      updatedAt: "2026-06-30 10:00:00",
    };
    const reward: RewardPointRecord = {
      id: "reward-1",
      orderId: "order-1",
      userId: "user-1",
      profileSnapshotId: "profile-1-v1",
      calculationBase: 10_000,
      rewardRateBps: 670,
      pointAmount: 670,
      cashEquivalent: 670,
      triggerType: "PAYMENT_SUCCESS",
      status: "GRANTED",
      idempotentKey: ledger.idempotentKey,
      lastErrorMessage: null,
      updatedAt: "2026-06-30 10:00:00",
    };
    expect(pending).not.toHaveProperty("phone");
    expect(reward.cashEquivalent).toBe(ledger.cashEquivalent);
  });

  it("links pool entries, settlements, audit and reconciliation", () => {
    const poolEntry: FundingPoolEntry = {
      id: "pool-entry-1",
      poolId: "pool-point",
      entryType: "OCCUPY",
      direction: "DEBIT",
      amount: 670,
      cashBalanceBefore: 100_000,
      cashBalanceAfter: 100_000,
      occupiedBefore: 0,
      occupiedAfter: 670,
      businessReference: "order-1",
      idempotentKey: "occupy:order-1:reward",
      status: "SUCCESS",
      auditRecordId: "audit-1",
      reconciliationStatus: "NOT_STARTED",
      createdAt: "2026-06-30 10:00:00",
      updatedAt: "2026-06-30 10:00:00",
    };
    const settlement: MerchantSettlement = {
      id: "settlement-1",
      settlementNo: "SET-001",
      merchantId: "merchant-1",
      shopId: "shop-1",
      splitInstructionIds: ["split-1"],
      periodStart: "2026-06-30",
      periodEnd: "2026-06-30",
      scheduledSettlementDate: "2026-07-01",
      merchantReceivableAmount: 9_000,
      adjustmentAmount: 0,
      actualPaidAmount: 0,
      status: "SCHEDULED",
      idempotentKey: "settlement:merchant-1:2026-07-01",
      reconciliationStatus: "NOT_STARTED",
      lastErrorMessage: null,
      updatedAt: "2026-06-30 10:00:00",
      createdAt: "2026-06-30 10:00:00",
    };
    const audit: AuditRecord = {
      id: "audit-1",
      entityType: "FUNDING_POOL_ENTRY",
      entityId: poolEntry.id,
      action: "OCCUPY",
      operatorType: "SYSTEM",
      operatorId: "mock-system",
      idempotentKey: poolEntry.idempotentKey,
      beforeState: "{}",
      afterState: "{}",
      result: "SUCCESS",
      errorMessage: null,
      occurredAt: "2026-06-30 10:00:00",
      status: "RECORDED",
      updatedAt: "2026-06-30 10:00:00",
    };
    const reconciliation: ReconciliationRecord = {
      id: "recon-1",
      reconId: "RECON-001",
      businessType: "SPLIT",
      businessReference: "split-1",
      expectedAmount: 10_000,
      actualAmount: 9_999,
      differenceAmount: 1,
      status: "MISMATCH",
      differenceType: "AMOUNT_MISMATCH",
      differenceDescription: "Mock 一分钱差异",
      resolutionStatus: "PENDING",
      resolvedBy: null,
      resolvedAt: null,
      createdAt: "2026-06-30 10:00:00",
      updatedAt: "2026-06-30 10:00:00",
    };
    const couponBatch: CouponFundingBatch = {
      id: "coupon-batch-1",
      batchNo: "CFB-001",
      fundingPoolId: "pool-coupon",
      issuerId: "issuer-1",
      issuerName: "示例发券机构",
      responsibilityMode: "UNCONFIRMED",
      rechargeAmount: 200_000,
      issuedLiability: 80_000,
      redeemedOccupiedAmount: 20_000,
      merchantReceivableAmount: 20_000,
      settledAmount: 10_000,
      differenceAmount: 10_000,
      reconciliationStatus: "MISMATCH",
      idempotentKey: "coupon-batch:1",
      status: "ACTIVE",
      updatedAt: "2026-06-30 10:00:00",
    };
    expect(audit.entityId).toBe(poolEntry.id);
    expect(settlement.reconciliationStatus).toBe("NOT_STARTED");
    expect(couponBatch.responsibilityMode).toBe("UNCONFIRMED");
    expect(reconciliation.differenceAmount).toBe(1);
  });
});
