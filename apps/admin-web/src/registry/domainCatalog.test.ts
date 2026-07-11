/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import traceability from "../../../../docs/delivery/requirements-traceability.json";
import {
  DOMAIN_CATALOG,
  FINANCE_SPECIALIZED_CAPABILITIES,
  getDomainBySlug,
  getDomainForRequirement,
} from "./domainCatalog";
import { requirementLedgerService } from "../services/requirementLedgerService";

describe("17-domain implementation catalog", () => {
  it("owns every requirement exactly once with named routes and real evidence locators", () => {
    expect(DOMAIN_CATALOG).toHaveLength(17);
    expect(new Set(DOMAIN_CATALOG.map((domain) => domain.slug)).size).toBe(17);
    expect(new Set(DOMAIN_CATALOG.map((domain) => domain.route)).size).toBe(17);
    expect(DOMAIN_CATALOG.every((domain) => domain.route === `/operations/domains/${domain.slug}`)).toBe(true);
    expect(JSON.stringify(DOMAIN_CATALOG)).not.toContain("planned:");
    expect(JSON.stringify(DOMAIN_CATALOG)).not.toMatch(/domain\/\d+/);

    const ids = DOMAIN_CATALOG.flatMap((domain) => domain.requirementIds);
    expect(ids).toHaveLength(93);
    expect(new Set(ids).size).toBe(93);
    expect(ids[0]).toBe("PC-080");
    expect(ids[ids.length - 1]).toBe("PC-172");
    expect(getDomainBySlug("finance")?.name).toBe("财务管理");
    expect(getDomainForRequirement("PC-172")?.slug).toBe("home-services");
  });

  it("maps every high-risk capability to an existing specialized page, service and test", () => {
    expect(Object.keys(FINANCE_SPECIALIZED_CAPABILITIES).sort()).toEqual([
      "couponFundingPool", "payment", "pointFundingPool", "pointGrant", "pointRecognition", "reconciliation", "refund", "settlement", "split",
    ]);
    for (const capability of Object.values(FINANCE_SPECIALIZED_CAPABILITIES)) {
      expect(capability.route.startsWith("/")).toBe(true);
      expect(capability.page.locator).toMatch(/^apps\/admin-web\/src\/pages\/[^#]+#\w+$/);
      expect(capability.service.locator).toMatch(/^apps\/admin-web\/src\/services\/[^#]+#\w+$/);
      expect(capability.test.locator).toMatch(/^apps\/admin-web\/src\/[^#]+#L\d+$/);
    }
  });
});

describe("93-row domain trace contract", () => {
  it("uses domain evidence distributions and preserves 24 disabled requirements", () => {
    expect(traceability).toHaveLength(93);
    expect(new Set(traceability.map((row) => row.id)).size).toBe(93);
    expect(traceability.filter((row) => row.status === "UNCONFIRMED_ACTION_DISABLED")).toHaveLength(24);
    expect(traceability.some((row) => row.status === "IMPLEMENTED_SPECIALIZED")).toBe(true);
    expect(traceability.some((row) => row.status === "IMPLEMENTED_SHARED")).toBe(true);
    expect(new Set(traceability.map((row) => row.route)).size).toBe(17);
    expect(new Set(traceability.map((row) => row.page)).size).toBeGreaterThan(2);
    expect(new Set(traceability.map((row) => row.service)).size).toBeGreaterThan(2);
    expect(new Set(traceability.map((row) => row.test)).size).toBeGreaterThan(2);
    expect(JSON.stringify(traceability)).not.toContain("planned:");
    expect(new Set(traceability.map((row) => row.evidenceHash)).size).toBe(93);
    for (const row of traceability) {
      const domain = getDomainForRequirement(row.id);
      expect(domain?.owner).toBe(row.owner);
      expect(row.route).toBe(domain?.route);
      expect((row as typeof row & { routeLocator: string }).routeLocator).toBe(domain?.routeLocator);
      expect((row as typeof row & { sourceSha256: string }).sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(row.evidenceHash).toMatch(/^[a-f0-9]{64}$/);
      expect(row.evidenceHash).not.toBe((row as typeof row & { sourceSha256: string }).sourceSha256);
    }
  });
});

describe("named route and UI/service boundary", () => {
  it("wires catalog routes without numeric domains and keeps pages behind services", () => {
    const pages = import.meta.glob("../pages/*.tsx", { eager: true, import: "default", query: "?raw" }) as Record<string, string>;
    const app = import.meta.glob("../App.tsx", { eager: true, import: "default", query: "?raw" }) as Record<string, string>;
    const layout = import.meta.glob("../layouts/AdminLayout.tsx", { eager: true, import: "default", query: "?raw" }) as Record<string, string>;
    const ledgerPage = pages["../pages/RequirementLedgerPage.tsx"];
    const financePage = pages["../pages/FinancialWorkbenchPage.tsx"];
    expect(ledgerPage).toContain("requirementLedgerService");
    expect(financePage).toContain("requirementLedgerService");
    expect(ledgerPage).not.toMatch(/from ["'][^"']*mocks\//);
    expect(financePage).not.toMatch(/from ["'][^"']*mocks\//);
    expect(Object.values(app).join("\n")).toContain("/operations/domains/:domainSlug");
    expect(Object.values(app).join("\n")).not.toContain("/operations/domain/:domainIndex");
    expect(Object.values(layout).join("\n")).toContain("DOMAIN_CATALOG.map");
    expect(ledgerPage).not.toContain("requirementLedgerService.execute");
    expect("execute" in requirementLedgerService).toBe(false);
  });

  it("resolves every code locator to an existing file and anchor", () => {
    const sourceFiles = {
      ...import.meta.glob("./*.ts", { eager: true, import: "default", query: "?raw" }),
      ...import.meta.glob("../**/*.{ts,tsx}", { eager: true, import: "default", query: "?raw" }),
    } as Record<string, string>;
    const locatorFields = ["routeLocator", "page", "service", "mock", "test", "verifier"] as const;
    for (const row of traceability) {
      for (const field of locatorFields) {
        const locator = (row as typeof row & { routeLocator: string })[field];
        const [path, anchor] = locator.split("#");
        const fileName = path.replace(/\\/g, "/").split("/").pop();
        const source = Object.entries(sourceFiles).find(([file]) => file.replace(/\\/g, "/").endsWith(`/${fileName}`))?.[1];
        expect(source, `${row.id} ${field} file ${path}`).toBeTypeOf("string");
        if (typeof source !== "string") throw new Error(`Missing locator source: ${path}`);
        if (/^L\d+$/.test(anchor)) {
          expect(Number(anchor.slice(1)), `${row.id} ${field} line`).toBeLessThanOrEqual(source.split(/\r?\n/).length);
        } else {
          expect(source, `${row.id} ${field} symbol ${anchor}`).toMatch(new RegExp(`\\b${anchor}\\b`));
        }
      }
    }
  });
});
