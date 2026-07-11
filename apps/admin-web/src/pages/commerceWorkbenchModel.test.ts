import { describe, expect, it } from "vitest";
import type { CommerceCase } from "../domain/commerceWorkflow";
import {
  buildCommerceSummary,
  buildCommerceTimeline,
  formatCommerceMoney,
  getPrimaryActionText,
} from "./commerceWorkbenchModel";

const base: CommerceCase = {
  id: "CASE-T",
  merchantName: "测试商户",
  productName: "测试商品",
  orderNo: "ORDER-T",
  orderAmount: 12_345,
  stage: "FULFILLMENT",
  riskMessage: "凭证待确认",
  updatedAt: "2026-07-11 12:00:00",
  audits: [],
};

describe("commerce workbench presentation model", () => {
  it("summarizes pending, risk, completed and refunded cases", () => {
    const summary = buildCommerceSummary([
      base,
      { ...base, id: "2", stage: "COMPLETED", riskMessage: "" },
      { ...base, id: "3", stage: "REFUNDED", riskMessage: "" },
    ]);

    expect(summary).toEqual({ total: 3, pending: 1, risk: 1, completed: 1, refunded: 1 });
  });

  it("builds a six-step main timeline and identifies the next action", () => {
    const timeline = buildCommerceTimeline(base);
    expect(timeline.map((item) => item.title)).toEqual([
      "商户审核",
      "商品上架",
      "订单支付",
      "履约确认",
      "结算处理",
      "业务完成",
    ]);
    expect(timeline.map((item) => item.status)).toEqual(["finish", "finish", "finish", "process", "wait", "wait"]);
    expect(getPrimaryActionText(base)).toBe("确认履约并生成结算单");
  });

  it("renders terminal and money states without inventing actions", () => {
    expect(getPrimaryActionText({ ...base, stage: "COMPLETED" })).toBe("流程已完成");
    expect(getPrimaryActionText({ ...base, stage: "REFUNDED" })).toBe("退款已完成");
    expect(formatCommerceMoney(12_345)).toBe("¥123.45");
  });
});
