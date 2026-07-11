// @ts-expect-error Vitest runs in Node; the application intentionally does not ship Node types.
import { existsSync, readFileSync } from "node:fs";
// @ts-expect-error Vitest runs in Node; the application intentionally does not ship Node types.
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DOMAIN_CATALOG, getDomainBySlug } from "./domainCatalog";

declare const process: { cwd(): string };

const workspaceRoot = resolve(process.cwd(), "../..");
const locatorExists = (locator: string) => {
  const [path, anchor] = locator.split("#");
  const absolute = resolve(workspaceRoot, path);
  return existsSync(absolute) && (!anchor || /^L\d+$/.test(anchor) || readFileSync(absolute, "utf8").includes(anchor));
};
const pageImportsService = (pageLocator: string, serviceLocator: string) => {
  const pagePath = pageLocator.split("#")[0];
  const serviceParts = serviceLocator.split("#")[0].split("/");
  const serviceFile = serviceParts[serviceParts.length - 1]?.replace(/\.ts$/, "");
  return readFileSync(resolve(workspaceRoot, pagePath), "utf8").includes(`../services/${serviceFile}`);
};

describe("typed 17-domain catalog", () => {
  it("uses 17 unique readable named routes and assigns all 93 requirements", () => {
    expect(DOMAIN_CATALOG).toHaveLength(17);
    expect(new Set(DOMAIN_CATALOG.map((domain) => domain.slug)).size).toBe(17);
    expect(new Set(DOMAIN_CATALOG.map((domain) => domain.route)).size).toBe(17);
    expect(DOMAIN_CATALOG.every((domain) => !/domain-\d+/.test(domain.slug + domain.route))).toBe(true);
    const ids = DOMAIN_CATALOG.flatMap((domain) => domain.requirementIds);
    expect(ids).toHaveLength(93);
    expect(new Set(ids).size).toBe(93);
    expect(ids).toEqual(Array.from({ length: 93 }, (_, i) => `PC-${String(i + 80).padStart(3, "0")}`));
  });

  it("binds every primary locator and specialized capability to an existing file", () => {
    for (const domain of DOMAIN_CATALOG) {
      expect(domain.owner).not.toBe("");
      expect(["IMPLEMENTED_SHARED", "IMPLEMENTED_SPECIALIZED"]).toContain(domain.maturity);
      for (const locator of [domain.primaryPage, domain.primaryService, domain.primaryTest]) {
        expect(locator).not.toContain("planned:");
        expect(locatorExists(locator), locator).toBe(true);
      }
      for (const capability of domain.specializedCapabilities) {
        expect(capability.route.startsWith("/")).toBe(true);
        expect(locatorExists(capability.page), capability.page).toBe(true);
        expect(locatorExists(capability.service), capability.service).toBe(true);
        expect(locatorExists(capability.test), capability.test).toBe(true);
        expect(pageImportsService(capability.page, capability.service), `${capability.page} -> ${capability.service}`).toBe(true);
      }
      expect(pageImportsService(domain.primaryPage, domain.primaryService), `${domain.primaryPage} -> ${domain.primaryService}`).toBe(true);
      expect(getDomainBySlug(domain.slug)?.name).toBe(domain.name);
    }
  });

  it("maps every critical money capability to existing specialized evidence", () => {
    const capabilities = DOMAIN_CATALOG.flatMap((domain) => domain.specializedCapabilities);
    for (const name of ["支付", "退款", "分账", "结算", "对账", "积分资金池", "消费券资金池", "积分发放", "积分认领"]) {
      const capability = capabilities.find((item) => item.name === name);
      expect(capability, name).toBeDefined();
      expect(capability?.service).not.toContain("operationsService.ts");
      expect(capability?.page).not.toContain("OperationsRegistryPage.tsx");
    }
  });

  it("keeps the shared page behind the domain service query boundary", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/OperationsRegistryPage.tsx"), "utf8");
    expect(source).toContain('from "../services/operationsService"');
    expect(source).not.toContain("OPERATION_REQUIREMENTS");
    expect(source).not.toContain("状态操作");
    expect(source).not.toContain("operationsService.execute");
  });
});
