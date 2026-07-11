import type { BaseRecord, Cents } from "./base";

export type ReconciliationBusinessType =
  | "PAYMENT"
  | "SPLIT"
  | "MERCHANT_SETTLEMENT"
  | "POINT_POOL"
  | "COUPON_POOL";
export type ReconciliationStatus = "NOT_STARTED" | "MATCHED" | "MISMATCH" | "RESOLVING" | "RESOLVED";
export type ReconciliationDifferenceType =
  | "NONE"
  | "AMOUNT_MISMATCH"
  | "EXTERNAL_MISSING"
  | "INTERNAL_MISSING"
  | "STATUS_MISMATCH";

export const ReconciliationStatusColor: Record<ReconciliationStatus, string> = {
  NOT_STARTED: "default",
  MATCHED: "green",
  MISMATCH: "red",
  RESOLVING: "processing",
  RESOLVED: "blue",
};

export interface ReconciliationRecord extends BaseRecord {
  reconId: string;
  businessType: ReconciliationBusinessType;
  businessReference: string;
  expectedAmount: Cents;
  actualAmount: Cents;
  differenceAmount: Cents;
  status: ReconciliationStatus;
  differenceType: ReconciliationDifferenceType;
  differenceDescription: string;
  resolutionStatus: "PENDING" | "PROCESSING" | "RESOLVED" | "UNCONFIRMED";
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}
