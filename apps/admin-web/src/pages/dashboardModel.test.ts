import { describe, expect, it } from "vitest";
import type { CommerceCase } from "../domain/commerceWorkflow";
import { buildWorkflowDashboard } from "./dashboardModel";

const caseItem = (id: string, stage: CommerceCase["stage"], riskMessage = ""): CommerceCase => ({
  id,
  merchantName: `商户${id}`,
  productName: `商品${id}`,
  orderNo: `ORDER-${id}`,
  orderAmount: 10_000,
  stage,
  riskMessage,
  updatedAt: "2026-07-11 12:00:00",
  audits: [],
});

describe("dashboard workflow summary", () => {
  it("derives business pending, risk, completion and next case from current state", () => {
    const result = buildWorkflowDashboard([
      caseItem("1", "FULFILLMENT", "履约凭证待确认"),
      caseItem("2", "COMPLETED"),
      caseItem("3", "REFUNDED"),
    ]);

    expect(result.pending).toBe(1);
    expect(result.risk).toBe(1);
    expect(result.completed).toBe(1);
    expect(result.nextCase?.id).toBe("1");
  });
});
