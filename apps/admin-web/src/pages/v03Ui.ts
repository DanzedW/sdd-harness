import type { SplitInstructionStatus } from "../domain";

export const V03_ROUTES = [
  { path: "/settlement-profiles", label: "商户结算画像" },
  { path: "/split-instructions", label: "分账台账" },
  { path: "/funding-pools/points", label: "积分资金池" },
  { path: "/point-grants", label: "积分批量发放" },
  { path: "/pending-points", label: "待认领积分" },
  { path: "/funding-pools/coupons", label: "消费券资金池" },
] as const;

export function canRetrySplit(status: SplitInstructionStatus) {
  return status === "FAILED" || status === "PARTIAL";
}

export function canReverseSplit(status: SplitInstructionStatus) {
  return status === "PARTIAL" || status === "SUCCESS";
}

export function formatCents(value: number) {
  return `¥${(value / 100).toFixed(2)}`;
}

export function financialStatusColor(status: string) {
  if (["SUCCESS", "PAID", "MATCHED", "ACTIVE", "GRANTED", "POSTED", "CLAIMED"].includes(status)) return "green";
  if (["FAILED", "MISMATCH", "RECLAIM_FAILED"].includes(status)) return "red";
  if (["PARTIAL", "WARNING", "UNCONFIRMED"].includes(status)) return "orange";
  if (["PROCESSING", "RESOLVING", "REVERSING"].includes(status)) return "processing";
  if (["REVERSED", "RESOLVED"].includes(status)) return "blue";
  return "default";
}
