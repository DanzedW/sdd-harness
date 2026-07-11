import { describe, expect, it } from "vitest";
import { createCommerceWorkflowService } from "./commerceWorkflowService";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("commerce workflow service", () => {
  it("advances one case through the complete merchant-to-settlement lifecycle", () => {
    const service = createCommerceWorkflowService(new MemoryStorage());
    const id = service.list()[0].id;
    const actions = [
      "APPROVE_MERCHANT",
      "PUBLISH_PRODUCT",
      "CONFIRM_PAYMENT",
      "CONFIRM_FULFILLMENT",
      "COMPLETE_SETTLEMENT",
    ] as const;

    actions.forEach((action, index) => {
      service.act(id, action, "运营员", `lifecycle-${index}`);
    });

    const completed = service.get(id);
    expect(completed.stage).toBe("COMPLETED");
    expect(completed.audits).toHaveLength(5);
    expect(completed.audits[0]).toMatchObject({
      action: "APPROVE_MERCHANT",
      fromStage: "MERCHANT_REVIEW",
      toStage: "PRODUCT_PUBLISH",
      operator: "运营员",
    });
  });

  it("rejects skipped transitions and invalid fractional money", () => {
    const storage = new MemoryStorage();
    const service = createCommerceWorkflowService(storage);
    const id = service.list()[0].id;

    expect(() => service.act(id, "CONFIRM_PAYMENT", "运营员", "skip-1")).toThrow("当前阶段不允许");
    expect(() => service.createCase({ merchantName: "错误金额", productName: "商品", orderAmount: 10.5 })).toThrow("整数分");
  });

  it("replays an idempotent action without duplicating audit records", () => {
    const service = createCommerceWorkflowService(new MemoryStorage());
    const id = service.list()[0].id;

    const first = service.act(id, "APPROVE_MERCHANT", "运营员", "same-key");
    const replay = service.act(id, "APPROVE_MERCHANT", "运营员", "same-key");

    expect(replay).toEqual(first);
    expect(service.get(id).audits).toHaveLength(1);
  });

  it("persists state, supports refund and restores demo data", () => {
    const storage = new MemoryStorage();
    const service = createCommerceWorkflowService(storage);
    const id = service.list()[0].id;
    service.act(id, "APPROVE_MERCHANT", "运营员", "refund-1");
    service.act(id, "PUBLISH_PRODUCT", "运营员", "refund-2");
    service.act(id, "CONFIRM_PAYMENT", "运营员", "refund-3");
    service.act(id, "REQUEST_REFUND", "客服", "refund-4", "用户取消订单");
    service.act(id, "COMPLETE_REFUND", "财务", "refund-5");

    const reloaded = createCommerceWorkflowService(storage);
    expect(reloaded.get(id).stage).toBe("REFUNDED");
    const audits = reloaded.get(id).audits;
    expect(audits[audits.length - 2]?.note).toBe("用户取消订单");

    reloaded.reset();
    expect(reloaded.list()[0].stage).toBe("MERCHANT_REVIEW");
    expect(reloaded.list()[0].audits).toHaveLength(0);
  });

  it("routes a settlement mismatch through reconciliation before completion", () => {
    const service = createCommerceWorkflowService(new MemoryStorage());
    const id = service.list()[1].id;
    expect(service.get(id).stage).toBe("SETTLEMENT");

    service.act(id, "FLAG_RECONCILIATION", "财务", "reconcile-1", "渠道少入账 1 分");
    expect(service.get(id).stage).toBe("RECONCILIATION");
    service.act(id, "RESOLVE_RECONCILIATION", "财务", "reconcile-2", "补录渠道流水");
    expect(service.get(id).stage).toBe("SETTLEMENT");
    service.act(id, "COMPLETE_SETTLEMENT", "财务", "reconcile-3");
    expect(service.get(id).stage).toBe("COMPLETED");
  });
});
