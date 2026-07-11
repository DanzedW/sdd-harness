import type {
  AuditRecord,
  ReconciliationRecord,
  SplitInstruction,
  SplitInstructionStatus,
} from "../domain";
import { assertSplitConservation } from "./settlementRules";

interface SplitServiceSeed {
  splits: SplitInstruction[];
  audits?: AuditRecord[];
  reconciliations?: ReconciliationRecord[];
}

interface RetrySplitInput {
  splitId: string;
  idempotentKey: string;
  operatorId: string;
  outcome: Extract<SplitInstructionStatus, "SUCCESS" | "FAILED" | "PARTIAL">;
}

interface ReverseSplitInput {
  splitId: string;
  idempotentKey: string;
  operatorId: string;
  reason: string;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createSplitService(seed: SplitServiceSeed) {
  let splits = clone(seed.splits);
  const audits = clone(seed.audits ?? []);
  const reconciliations = clone(seed.reconciliations ?? []);
  const operationResults = new Map<string, unknown>();
  let sequence = audits.length + reconciliations.length;
  const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);
  const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++sequence}`;

  for (const item of splits) {
    assertSplitConservation(item);
  }

  function requireSplit(splitId: string) {
    const item = splits.find((candidate) => candidate.id === splitId);
    if (!item) throw new Error(`split ${splitId} not found`);
    return item;
  }

  function saveSplit(split: SplitInstruction) {
    splits = splits.map((item) => (item.id === split.id ? split : item));
  }

  function audit(
    split: SplitInstruction,
    before: SplitInstruction,
    action: "RETRY" | "REVERSE",
    operatorId: string,
    idempotentKey: string,
  ): AuditRecord {
    const occurredAt = now();
    const record: AuditRecord = {
      id: nextId("audit-split"),
      entityType: "SPLIT_INSTRUCTION",
      entityId: split.id,
      action,
      operatorType: "OPERATOR",
      operatorId,
      idempotentKey,
      beforeState: JSON.stringify(before),
      afterState: JSON.stringify(split),
      result: "SUCCESS",
      errorMessage: null,
      occurredAt,
      status: "RECORDED",
      updatedAt: occurredAt,
    };
    audits.push(record);
    return record;
  }

  return {
    listSplits: () => clone(splits),
    listAuditRecords: () => clone(audits),
    listReconciliations: () => clone(reconciliations),

    retry(input: RetrySplitInput) {
      const existing = operationResults.get(input.idempotentKey);
      if (existing) return clone(existing as { split: SplitInstruction; audit: AuditRecord });
      const current = requireSplit(input.splitId);
      if (current.status !== "FAILED" && current.status !== "PARTIAL") {
        throw new Error(`cannot retry split from ${current.status}`);
      }
      const before = clone(current);
      const updated: SplitInstruction = {
        ...current,
        attemptCount: current.attemptCount + 1,
        status: input.outcome,
        lastErrorCode: input.outcome === "FAILED" ? "MOCK_RETRY_FAILED" : null,
        lastErrorMessage: input.outcome === "FAILED" ? "Mock retry failed" : null,
        reconciliationStatus: input.outcome === "PARTIAL" ? "MISMATCH" : current.reconciliationStatus,
        updatedAt: now(),
      };
      saveSplit(updated);
      const auditRecord = audit(updated, before, "RETRY", input.operatorId, input.idempotentKey);
      const result = { split: clone(updated), audit: clone(auditRecord) };
      operationResults.set(input.idempotentKey, result);
      return clone(result);
    },

    reverse(input: ReverseSplitInput) {
      const existing = operationResults.get(input.idempotentKey);
      if (existing) {
        return clone(existing as {
          split: SplitInstruction;
          audit: AuditRecord;
          reconciliation: ReconciliationRecord;
        });
      }
      const current = requireSplit(input.splitId);
      if (current.status !== "PARTIAL" && current.status !== "SUCCESS") {
        throw new Error(`cannot reverse split from ${current.status}`);
      }
      const before = clone(current);
      const updated: SplitInstruction = {
        ...current,
        status: "REVERSED",
        reconciliationStatus: "RESOLVING",
        lastErrorCode: null,
        lastErrorMessage: input.reason,
        updatedAt: now(),
      };
      saveSplit(updated);
      const auditRecord = audit(updated, before, "REVERSE", input.operatorId, input.idempotentKey);
      const timestamp = now();
      const reconciliation: ReconciliationRecord = {
        id: nextId("recon-split"),
        reconId: nextId("RECON"),
        businessType: "SPLIT",
        businessReference: updated.splitInstructionNo,
        expectedAmount: updated.allocationBase,
        actualAmount: 0,
        differenceAmount: updated.allocationBase,
        status: "RESOLVING",
        differenceType: "STATUS_MISMATCH",
        differenceDescription: input.reason,
        resolutionStatus: "PROCESSING",
        resolvedBy: input.operatorId,
        resolvedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      reconciliations.push(reconciliation);
      const result = {
        split: clone(updated),
        audit: clone(auditRecord),
        reconciliation: clone(reconciliation),
      };
      operationResults.set(input.idempotentKey, result);
      return clone(result);
    },
  };
}

export type SplitService = ReturnType<typeof createSplitService>;
