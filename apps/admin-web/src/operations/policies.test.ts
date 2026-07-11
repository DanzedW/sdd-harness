import { describe, expect, it } from "vitest";
import { basisPointsToPercent, centsToYuan, canExecuteRequirement } from "./policies";

describe("operations safety policies", () => {
  it("blocks real actions for UNCONFIRMED requirements", () => {
    expect(canExecuteRequirement({ unconfirmed: true }, "view")).toBe(true);
    expect(canExecuteRequirement({ unconfirmed: true }, "execute")).toBe(false);
    expect(canExecuteRequirement({ unconfirmed: false }, "execute")).toBe(true);
  });

  it("formats integer cents and basis points without floating storage", () => {
    expect(centsToYuan(12345)).toBe("¥123.45");
    expect(basisPointsToPercent(875)).toBe("8.75%");
    expect(() => centsToYuan(1.5)).toThrow(/integer/i);
    expect(() => basisPointsToPercent(2.2)).toThrow(/integer/i);
  });
});
