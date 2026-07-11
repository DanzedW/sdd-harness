import { describe, expect, it } from "vitest";
import { createRequirementLedgerService } from "./requirementLedgerService";

describe("requirement ledger service", () => {
  it("queries the registry and rejects all UNCONFIRMED mutations", async () => {
    const service = createRequirementLedgerService();
    const result = await service.query({ unconfirmed: true });
    expect(result.items).toHaveLength(24);
    await expect(service.execute(result.items[0].id, "idem-1", "SIMULATE", {})).rejects.toThrow("UNCONFIRMED");
  });

  it("replays only the identical confirmed request", async () => {
    const service = createRequirementLedgerService();
    const first = await service.execute("PC-080", "idem-confirmed", "SIMULATE", { rateBp: 250, amountCent: 12_300 });
    const replay = await service.execute("PC-080", "idem-confirmed", "SIMULATE", { amountCent: 12_300, rateBp: 250 });
    expect(replay.auditId).toBe(first.auditId);
    expect((await service.auditTrail()).filter((item) => item.idempotencyKey === "idem-confirmed")).toHaveLength(1);
  });

  it("validates unknown and UNCONFIRMED requirements before replay lookup", async () => {
    const service = createRequirementLedgerService();
    await service.execute("PC-080", "shared-key", "SIMULATE", { amountCent: 100 });
    await expect(service.execute("PC-083", "shared-key", "SIMULATE", { amountCent: 100 })).rejects.toThrow("UNCONFIRMED");
    await expect(service.execute("PC-999", "shared-key", "SIMULATE", { amountCent: 100 })).rejects.toThrow("需求不存在");
  });

  it("rejects a reused key with a different requirement, action or canonical payload", async () => {
    const service = createRequirementLedgerService();
    await service.execute("PC-080", "conflict-key", "SIMULATE", { amountCent: 100, rateBp: 250 });
    await expect(service.execute("PC-081", "conflict-key", "SIMULATE", { amountCent: 100, rateBp: 250 })).rejects.toThrow("幂等键冲突");
    await expect(service.execute("PC-080", "conflict-key", "PREVIEW", { amountCent: 100, rateBp: 250 })).rejects.toThrow("幂等键冲突");
    await expect(service.execute("PC-080", "conflict-key", "SIMULATE", { amountCent: 101, rateBp: 250 })).rejects.toThrow("幂等键冲突");
  });

  it("rejects invalid integer financial primitives before recording audit", async () => {
    const service = createRequirementLedgerService();
    await expect(service.execute("PC-080", "bad-cent", "SIMULATE", { amountCent: 1.2 })).rejects.toThrow("整数分");
    await expect(service.execute("PC-080", "bad-bp", "SIMULATE", { rateBp: 10_001 })).rejects.toThrow("整数基点");
    expect(await service.auditTrail()).toHaveLength(0);
  });
});
