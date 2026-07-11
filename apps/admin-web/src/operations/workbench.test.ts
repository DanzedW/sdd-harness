import { describe, expect, it } from "vitest";
import { getWorkbenchKind } from "./workbench";

describe("workbench selection", () => {
  it("routes money and settlement semantics to the finance workbench", () => {
    expect(getWorkbenchKind({ group: "财务管理", detail: "查询支付订单金额" })).toBe("finance");
    expect(getWorkbenchKind({ group: "票券管理", detail: "消费券结算与对账" })).toBe("finance");
    expect(getWorkbenchKind({ group: "内容运营", detail: "发布文章" })).toBe("registry");
  });
});
