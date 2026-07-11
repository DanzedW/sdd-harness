import { describe, expect, it } from "vitest";
import { createRequirementLedgerService } from "./requirementLedgerService";

describe("requirement ledger service", () => {
  it("queries the registry and rejects all UNCONFIRMED mutations", async () => {
    const service = createRequirementLedgerService();
    const result = await service.query({ unconfirmed: true });
    expect(result.items).toHaveLength(24);
    await expect(service.execute(result.items[0].id, "idem-1")).rejects.toThrow("UNCONFIRMED");
  });

  it("executes confirmed actions idempotently with integer financial primitives and audit", async () => {
    const service = createRequirementLedgerService();
    const first = await service.execute("PC-080", "idem-confirmed", { amountCent: 12_300, rateBp: 250 });
    const replay = await service.execute("PC-080", "idem-confirmed", { amountCent: 12_300, rateBp: 250 });
    expect(replay.auditId).toBe(first.auditId);
    expect((await service.auditTrail()).filter((item) => item.idempotencyKey === "idem-confirmed")).toHaveLength(1);
    await expect(service.execute("PC-080", "bad-cent", { amountCent: 1.2 })).rejects.toThrow("整数分");
    await expect(service.execute("PC-080", "bad-bp", { rateBp: 10_001 })).rejects.toThrow("整数基点");
  });
});
