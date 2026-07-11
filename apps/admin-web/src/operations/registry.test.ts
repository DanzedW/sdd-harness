import { describe, expect, it } from "vitest";
import { OPERATION_DOMAINS, OPERATION_REQUIREMENTS, getRequirement } from "./registry";

describe("PC operations registry", () => {
  it("registers 17 domains and 93 continuous unique requirements", () => {
    expect(OPERATION_DOMAINS).toHaveLength(17);
    expect(OPERATION_REQUIREMENTS).toHaveLength(93);
    expect(new Set(OPERATION_REQUIREMENTS.map((item) => item.id)).size).toBe(93);
    expect(OPERATION_REQUIREMENTS.map((item) => item.id)).toEqual(
      Array.from({ length: 93 }, (_, index) => `PC-${String(index + 80).padStart(3, "0")}`),
    );
  });

  it("preserves exactly 24 unconfirmed requirements", () => {
    expect(OPERATION_REQUIREMENTS.filter((item) => item.unconfirmed)).toHaveLength(24);
    expect(getRequirement("PC-083")?.unconfirmed).toBe(true);
    expect(getRequirement("PC-080")?.unconfirmed).toBe(false);
  });
});
