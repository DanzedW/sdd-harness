/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

describe("Mock data privacy", () => {
  it("does not persist or display complete mainland mobile numbers", () => {
    const sources = import.meta.glob("./*.ts", {
      eager: true,
      import: "default",
      query: "?raw",
    }) as Record<string, string>;
    const offenders = Object.entries(sources)
      .filter(([file]) => !file.endsWith(".test.ts"))
      .filter(([, source]) => /1[3-9]\d{9}/.test(source))
      .map(([file]) => file);

    expect(offenders).toEqual([]);
  });
});
