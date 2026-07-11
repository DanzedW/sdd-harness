import { describe, expect, it } from "vitest";
import { createRequirementLedgerService, requirementLedgerService } from "./requirementLedgerService";

describe("read-only requirement ledger service", () => {
  it("exposes query, detail and audit read without a generic mutation API", () => {
    const service = createRequirementLedgerService();
    expect(Object.keys(service).sort()).toEqual(["auditTrail", "get", "query"]);
    expect("execute" in service).toBe(false);
    expect("execute" in requirementLedgerService).toBe(false);
  });

  it("returns all 24 UNCONFIRMED requirements as read-only source facts", async () => {
    const service = createRequirementLedgerService();
    const result = await service.query({ unconfirmed: true });
    expect(result.items).toHaveLength(24);
    expect(result.items.every((item) => item.unconfirmed)).toBe(true);
    expect(await service.get(result.items[0].id)).toEqual(result.items[0]);
    expect(await service.auditTrail()).toEqual([]);
  });

  it("rejects unknown detail IDs without creating an audit", async () => {
    const service = createRequirementLedgerService();
    await expect(service.get("PC-999")).rejects.toThrow("需求不存在");
    expect(await service.auditTrail()).toEqual([]);
  });
});
