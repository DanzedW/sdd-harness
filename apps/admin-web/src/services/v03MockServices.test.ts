import { describe, expect, it } from "vitest";
import { createV03MockServices } from "./v03MockServices";

describe("V0.3 integrated Mock services", () => {
  it("exposes merchant profiles, conserved split states and both funding pool types", async () => {
    const services = createV03MockServices();
    const profiles = await services.settlementProfileService.list();
    const splits = await services.splitLedgerService.list();
    const pools = await services.fundingPoolLedgerService.listPools();

    expect(profiles).toHaveLength(3);
    expect(profiles.map((item) => item.settlementCycleType)).toEqual([
      "T_PLUS_1",
      "T_PLUS_N",
      "UNCONFIRMED",
    ]);
    expect(splits.map((item) => item.status)).toEqual(
      expect.arrayContaining(["SUCCESS", "FAILED", "PARTIAL", "PENDING"]),
    );
    expect(pools.map((item) => item.type)).toEqual(expect.arrayContaining(["POINT", "COUPON"]));
  });

  it("provides a partial Excel preview/execution and masked pending account", async () => {
    const services = createV03MockServices();
    const preview = await services.pointGrantAdminService.previewDemoExcel(
      "demo-grant.xlsx",
      "upload:demo-page",
    );
    expect(preview.details.some((item) => item.status === "INVALID")).toBe(true);
    await services.pointGrantAdminService.approve(preview.batch.id, "operator-demo");
    const result = await services.pointGrantAdminService.execute(
      preview.batch.id,
      "execute:demo-page",
    );
    expect(result.batch.status).toBe("PARTIAL");
    const pending = await services.pointGrantAdminService.listPending();
    expect(pending.some((item) => item.phoneMasked.includes("****"))).toBe(true);
    expect(pending.every((item) => !/^1\d{10}$/.test(item.phoneMasked))).toBe(true);
  });

  it("exposes coupon funding mode as explicit unconfirmed state", async () => {
    const services = createV03MockServices();
    const batches = await services.couponFundingService.listBatches();
    expect(batches[0].responsibilityMode).toBe("UNCONFIRMED");
  });
});
