import { describe, expect, it } from "vitest";
import { V03_ROUTES, canRetrySplit, canReverseSplit } from "./v03Ui";

describe("V0.3 admin UI contracts", () => {
  it("registers the six MVP routes and excludes B2B", () => {
    expect(V03_ROUTES.map((item) => item.path)).toEqual([
      "/settlement-profiles",
      "/split-instructions",
      "/funding-pools/points",
      "/point-grants",
      "/pending-points",
      "/funding-pools/coupons",
    ]);
    expect(JSON.stringify(V03_ROUTES).toLowerCase()).not.toContain("b2b");
  });

  it("enables retry and reversal only for valid split states", () => {
    expect(canRetrySplit("FAILED")).toBe(true);
    expect(canRetrySplit("PARTIAL")).toBe(true);
    expect(canRetrySplit("SUCCESS")).toBe(false);
    expect(canReverseSplit("PARTIAL")).toBe(true);
    expect(canReverseSplit("SUCCESS")).toBe(true);
    expect(canReverseSplit("FAILED")).toBe(false);
  });
});
