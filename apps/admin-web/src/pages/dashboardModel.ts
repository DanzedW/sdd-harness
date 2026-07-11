import type { CommerceCase } from "../domain/commerceWorkflow";
import { buildCommerceSummary } from "./commerceWorkbenchModel";

export function buildWorkflowDashboard(cases: CommerceCase[]) {
  const summary = buildCommerceSummary(cases);
  return {
    pending: summary.pending,
    risk: summary.risk,
    completed: summary.completed,
    nextCase: cases.find((item) => item.stage !== "COMPLETED" && item.stage !== "REFUNDED"),
  };
}
