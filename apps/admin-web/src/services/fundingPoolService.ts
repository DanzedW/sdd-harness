import type {
  AuditAction,
  AuditRecord,
  FundingPool,
  FundingPoolEntry,
  FundingPoolEntryType,
} from "../domain";
import { assertValidCents } from "./settlementRules";

export interface FundingOperationInput {
  poolId: string;
  amount: number;
  businessReference: string;
  idempotentKey: string;
  operatorId: string;
}

export interface FundingOperationResult {
  pool: FundingPool;
  entry: FundingPoolEntry;
  audit: AuditRecord;
  risk: "NONE" | "LOW_BALANCE" | "OVER_ISSUE";
}

interface FundingPoolServiceSeed {
  pools: FundingPool[];
  entries?: FundingPoolEntry[];
  audits?: AuditRecord[];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createFundingPoolService(seed: FundingPoolServiceSeed) {
  let pools = clone(seed.pools);
  const entries = clone(seed.entries ?? []);
  const audits = clone(seed.audits ?? []);
  let sequence = entries.length + audits.length;

  const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);
  const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++sequence}`;

  function requirePool(poolId: string): FundingPool {
    const pool = pools.find((item) => item.id === poolId);
    if (!pool) throw new Error(`funding pool ${poolId} not found`);
    return pool;
  }

  function findIdempotentResult(idempotentKey: string): FundingOperationResult | null {
    const entry = entries.find((item) => item.idempotentKey === idempotentKey);
    if (!entry) return null;
    const audit = audits.find((item) => item.id === entry.auditRecordId);
    if (!audit) throw new Error(`audit record for ${idempotentKey} not found`);
    return {
      pool: clone(requirePool(entry.poolId)),
      entry: clone(entry),
      audit: clone(audit),
      risk: riskFor(requirePool(entry.poolId)),
    };
  }

  function riskFor(pool: FundingPool): FundingOperationResult["risk"] {
    const available = pool.cashBalance - pool.issuedLiability - pool.occupiedAmount;
    if (available < 0) return "OVER_ISSUE";
    if (available < pool.warningThreshold) return "LOW_BALANCE";
    return "NONE";
  }

  function createAudit(
    action: AuditAction,
    input: FundingOperationInput,
    beforeState: FundingPool,
    afterState: FundingPool,
    result: "SUCCESS" | "FAILED",
    errorMessage: string | null,
  ): AuditRecord {
    const occurredAt = now();
    const audit: AuditRecord = {
      id: nextId("audit"),
      entityType: "FUNDING_POOL_ENTRY",
      entityId: input.businessReference,
      action,
      operatorType: input.operatorId === "mock-system" ? "SYSTEM" : "OPERATOR",
      operatorId: input.operatorId,
      idempotentKey: input.idempotentKey,
      beforeState: JSON.stringify(beforeState),
      afterState: JSON.stringify(afterState),
      result,
      errorMessage,
      occurredAt,
      status: "RECORDED",
      updatedAt: occurredAt,
    };
    audits.push(audit);
    return audit;
  }

  function execute(
    entryType: FundingPoolEntryType,
    action: AuditAction,
    input: FundingOperationInput,
    mutate: (pool: FundingPool) => FundingPool,
  ): FundingOperationResult {
    const existing = findIdempotentResult(input.idempotentKey);
    if (existing) return existing;
    assertValidCents(input.amount, "funding operation amount");
    if (input.amount === 0) throw new Error("funding operation amount must be greater than zero");
    const current = requirePool(input.poolId);
    const before = clone(current);
    let after: FundingPool;
    try {
      after = mutate(clone(current));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      createAudit(action, input, before, before, "FAILED", message);
      throw error;
    }
    const risk = riskFor(after);
    if (risk !== "NONE") after.status = "WARNING";
    after.updatedAt = now();
    pools = pools.map((item) => (item.id === after.id ? after : item));
    const audit = createAudit(action, input, before, after, "SUCCESS", null);
    const entry: FundingPoolEntry = {
      id: nextId("funding-entry"),
      poolId: after.id,
      entryType,
      direction: entryType === "RECHARGE" || entryType === "RELEASE" ? "CREDIT" : "DEBIT",
      amount: input.amount,
      cashBalanceBefore: before.cashBalance,
      cashBalanceAfter: after.cashBalance,
      occupiedBefore: before.occupiedAmount,
      occupiedAfter: after.occupiedAmount,
      businessReference: input.businessReference,
      idempotentKey: input.idempotentKey,
      status: "SUCCESS",
      auditRecordId: audit.id,
      reconciliationStatus: "NOT_STARTED",
      createdAt: after.updatedAt,
      updatedAt: after.updatedAt,
    };
    entries.push(entry);
    return { pool: clone(after), entry: clone(entry), audit: clone(audit), risk };
  }

  return {
    listPools: () => clone(pools),
    getPool: (poolId: string) => clone(requirePool(poolId)),
    listEntries: () => clone(entries),
    listAuditRecords: () => clone(audits),

    recharge: (input: FundingOperationInput) =>
      execute("RECHARGE", "RECHARGE", input, (pool) => ({
        ...pool,
        cashBalance: pool.cashBalance + input.amount,
      })),

    issue: (input: FundingOperationInput) =>
      execute("ISSUE", "ISSUE", input, (pool) => {
        if (pool.allowOverIssue === "UNCONFIRMED") {
          throw new Error("over-issue policy is unconfirmed");
        }
        const available = pool.cashBalance - pool.issuedLiability - pool.occupiedAmount;
        if (!pool.allowOverIssue && input.amount > available) {
          throw new Error("insufficient available balance for point or coupon issuance");
        }
        return { ...pool, issuedLiability: pool.issuedLiability + input.amount };
      }),

    occupy: (input: FundingOperationInput) =>
      execute("OCCUPY", "OCCUPY", input, (pool) => {
        if (input.amount > pool.issuedLiability) {
          throw new Error("insufficient issued liability to occupy");
        }
        return {
          ...pool,
          issuedLiability: pool.issuedLiability - input.amount,
          occupiedAmount: pool.occupiedAmount + input.amount,
        };
      }),

    release: (input: FundingOperationInput) =>
      execute("RELEASE", "RELEASE", input, (pool) => {
        if (input.amount > pool.occupiedAmount) {
          throw new Error("insufficient occupied amount to release");
        }
        return {
          ...pool,
          issuedLiability: pool.issuedLiability + input.amount,
          occupiedAmount: pool.occupiedAmount - input.amount,
        };
      }),

    settle: (input: FundingOperationInput) =>
      execute("SETTLE", "SETTLE", input, (pool) => {
        if (input.amount > pool.occupiedAmount) {
          throw new Error("insufficient occupied amount to settle");
        }
        if (input.amount > pool.cashBalance) {
          throw new Error("insufficient cash balance to settle");
        }
        return {
          ...pool,
          cashBalance: pool.cashBalance - input.amount,
          occupiedAmount: pool.occupiedAmount - input.amount,
          settledAmount: pool.settledAmount + input.amount,
        };
      }),
  };
}

export type FundingPoolService = ReturnType<typeof createFundingPoolService>;
