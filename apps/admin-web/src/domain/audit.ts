import type { BaseRecord } from "./base";

export type AuditEntityType =
  | "SPLIT_INSTRUCTION"
  | "MERCHANT_SETTLEMENT"
  | "FUNDING_POOL"
  | "FUNDING_POOL_ENTRY"
  | "POINT_GRANT_BATCH"
  | "PENDING_POINT_ACCOUNT"
  | "RECONCILIATION";

export type AuditAction =
  | "CREATE"
  | "APPROVE"
  | "EXECUTE"
  | "RETRY"
  | "REVERSE"
  | "RECHARGE"
  | "ISSUE"
  | "OCCUPY"
  | "RELEASE"
  | "SETTLE"
  | "ADJUST"
  | "CLAIM";

export interface AuditRecord extends BaseRecord {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  operatorType: "SYSTEM" | "OPERATOR" | "USER";
  operatorId: string;
  idempotentKey: string;
  beforeState: string;
  afterState: string;
  result: "SUCCESS" | "FAILED";
  errorMessage: string | null;
  occurredAt: string;
  status: "RECORDED";
}
