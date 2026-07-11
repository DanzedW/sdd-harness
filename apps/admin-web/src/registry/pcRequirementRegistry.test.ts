import { describe, expect, it } from "vitest";
import { PC_REQUIREMENTS, PC_REQUIREMENT_GROUPS, validateRegistry } from "./pcRequirementRegistry";

describe("PC requirement registry", () => {
  it("contains the complete consecutive PC-080..PC-172 scope in 17 domains", () => {
    expect(PC_REQUIREMENTS).toHaveLength(93);
    expect(PC_REQUIREMENTS[0].id).toBe("PC-080");
    expect(PC_REQUIREMENTS[PC_REQUIREMENTS.length - 1]?.id).toBe("PC-172");
    expect(new Set(PC_REQUIREMENTS.map((item) => item.id)).size).toBe(93);
    expect(PC_REQUIREMENT_GROUPS).toHaveLength(17);
    expect(validateRegistry()).toEqual({ valid: true, errors: [] });
  });

  it("retains exactly 24 unconfirmed requirements and executable routes", () => {
    expect(PC_REQUIREMENTS.filter((item) => item.unconfirmed)).toHaveLength(24);
    expect(PC_REQUIREMENTS.every((item) => item.route.startsWith("/operations/"))).toBe(true);
  });
});
