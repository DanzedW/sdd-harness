import { describe, expect, it } from "vitest";
import type { SplitInstruction } from "../domain";
import { createSplitService } from "./splitService";

function split(status: SplitInstruction["status"]): SplitInstruction {
  return {
    id: "split-1",
    splitInstructionNo: "SPLIT-001",
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
    settlementEligibleAt: "2026-07-01 10:00:00",
    scheduledSettlementDate: "2026-07-02",
    idempotentKey: "split:order-1:v1",
    attemptCount: 1,
    lastErrorCode: status === "FAILED" ? "CHANNEL_TIMEOUT" : null,
    lastErrorMessage: status === "FAILED" ? "Mock channel timeout" : null,
    status,
    reconciliationStatus: status === "PARTIAL" ? "MISMATCH" : "NOT_STARTED",
    updatedAt: "2026-07-01 10:00:00",
    createdAt: "2026-07-01 10:00:00",
  };
}

describe("split retry, reversal, audit and reconciliation", () => {
  it("rejects non-conserved split seeds", () => {
    expect(() =>
      createSplitService({
        splits: [{ ...split("FAILED"), merchantAmount: 8_999 }],
      }),
    ).toThrow("must equal allocation base");
  });

  it("retries a failed split idempotently and records audit", () => {
    const service = createSplitService({ splits: [split("FAILED")] });
    const retried = service.retry({
      splitId: "split-1",
      idempotentKey: "retry:split-1:2",
      operatorId: "operator-1",
      outcome: "SUCCESS",
    });
    const repeated = service.retry({
      splitId: "split-1",
      idempotentKey: "retry:split-1:2",
      operatorId: "operator-1",
      outcome: "SUCCESS",
    });
    expect(retried.split.attemptCount).toBe(2);
    expect(retried.split.status).toBe("SUCCESS");
    expect(repeated.audit.id).toBe(retried.audit.id);
    expect(service.listAuditRecords()).toHaveLength(1);
  });

  it("reverses a partial split and creates resolving reconciliation", () => {
    const service = createSplitService({ splits: [split("PARTIAL")] });
    const reversed = service.reverse({
      splitId: "split-1",
      idempotentKey: "reverse:split-1",
      operatorId: "operator-1",
      reason: "部分成功按 Mock 人工指令冲正",
    });
    expect(reversed.split.status).toBe("REVERSED");
    expect(reversed.reconciliation.status).toBe("RESOLVING");
    expect(reversed.audit.action).toBe("REVERSE");
  });

  it("does not allow reversal from a failed state", () => {
    const service = createSplitService({ splits: [split("FAILED")] });
    expect(() =>
      service.reverse({
        splitId: "split-1",
        idempotentKey: "reverse:failed",
        operatorId: "operator-1",
        reason: "invalid transition",
      }),
    ).toThrow("cannot reverse");
  });
});
