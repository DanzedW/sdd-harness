import { describe, expect, it } from "vitest";
import { operationsService } from "./operationsService";

describe("operations service", () => {
  it("queries registry-backed mock records through a service", async () => {
    const result = await operationsService.query({ keyword: "提现", page: 1, pageSize: 20 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((item) => `${item.module}${item.detail}`.includes("提现"))).toBe(true);
  });

  it("exposes a read-only query boundary with no generic mutation", () => {
    expect(operationsService).not.toHaveProperty("execute");
  });
});
