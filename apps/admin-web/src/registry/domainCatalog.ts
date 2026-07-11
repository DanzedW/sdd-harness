import { PC_REQUIREMENTS, type PcRequirement } from "./pcRequirementRegistry";

export type DomainMaturity = "SPECIALIZED" | "SHARED" | "BLOCKED";
export type FinanceSafetyLevel = "L" | "M" | "N/A";

export interface EvidenceTarget {
  name: string;
  locator: string;
  route?: string;
}

export interface DomainCatalogEntry {
  name: string;
  slug: string;
  route: string;
  routeLocator: string;
  owner: string;
  requirementIds: string[];
  primaryPage: EvidenceTarget;
  primaryService: EvidenceTarget;
  primaryMock: EvidenceTarget;
  primaryTest: EvidenceTarget;
  maturity: DomainMaturity;
  financeSafety: {
    level: FinanceSafetyLevel;
    controls: string[];
    specializedCapabilities: string[];
  };
}

export interface SpecializedCapability {
  label: string;
  route: string;
  page: EvidenceTarget;
  service: EvidenceTarget;
  mock: EvidenceTarget;
  test: EvidenceTarget;
}

const idsFor = (group: string) => PC_REQUIREMENTS.filter((item) => item.group === group).map((item) => item.id);
const sharedPage = (route: string): EvidenceTarget => ({ name: "RequirementLedgerPage", route, locator: "apps/admin-web/src/pages/RequirementLedgerPage.tsx#RequirementLedgerPage" });
const sharedService: EvidenceTarget = { name: "requirementLedgerService", locator: "apps/admin-web/src/services/requirementLedgerService.ts#requirementLedgerService" };
const sharedMock: EvidenceTarget = { name: "requirementLedgerService Mock", locator: "apps/admin-web/src/services/requirementLedgerService.ts#createRequirementLedgerService" };
const sharedTest: EvidenceTarget = { name: "requirement registry contract", locator: "apps/admin-web/src/registry/pcRequirementRegistry.test.ts#L5" };

const domain = (entry: Omit<DomainCatalogEntry, "requirementIds">): DomainCatalogEntry => ({ ...entry, requirementIds: idsFor(entry.name) });

export const contentOperationsDomain = domain({
  name: "内容运营", slug: "content-operations", route: "/operations/domains/content-operations", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#contentOperationsDomain", owner: "内容运营负责人",
  primaryPage: sharedPage("/operations/domains/content-operations"), primaryService: sharedService, primaryMock: sharedMock, primaryTest: sharedTest, maturity: "SHARED",
  financeSafety: { level: "N/A", controls: ["状态审计"], specializedCapabilities: [] },
});
export const userManagementDomain = domain({
  name: "用户管理", slug: "user-management", route: "/operations/domains/user-management", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#userManagementDomain", owner: "用户运营与风控负责人",
  primaryPage: { name: "UserPage", route: "/users", locator: "apps/admin-web/src/pages/UserPage.tsx#UserPage" }, primaryService: { name: "adminService", locator: "apps/admin-web/src/services/adminService.ts#adminService" }, primaryMock: { name: "user Mock", locator: "apps/admin-web/src/mocks/data.ts#L1" }, primaryTest: { name: "privacy test", locator: "apps/admin-web/src/mocks/privacy.test.ts#L5" }, maturity: "SPECIALIZED",
  financeSafety: { level: "M", controls: ["手机号脱敏", "状态审计", "UNCONFIRMED 阻断"], specializedCapabilities: [] },
});
export const invoiceLotteryDomain = domain({
  name: "发票抽奖", slug: "invoice-lottery", route: "/operations/domains/invoice-lottery", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#invoiceLotteryDomain", owner: "活动运营与财务风控负责人",
  primaryPage: { name: "FinancialWorkbenchPage", route: "/financial-workbench", locator: "apps/admin-web/src/pages/FinancialWorkbenchPage.tsx#FinancialWorkbenchPage" }, primaryService: sharedService, primaryMock: sharedMock, primaryTest: { name: "UNCONFIRMED guard test", locator: "apps/admin-web/src/services/requirementLedgerService.test.ts#L5" }, maturity: "BLOCKED",
  financeSafety: { level: "L", controls: ["真实动作禁用", "幂等", "审计"], specializedCapabilities: [] },
});
export const categoryInformationDomain = domain({
  name: "分类信息", slug: "category-information", route: "/operations/domains/category-information", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#categoryInformationDomain", owner: "分类内容运营负责人",
  primaryPage: { name: "CategoryPage", route: "/categories", locator: "apps/admin-web/src/pages/CategoryPage.tsx#CategoryPage" }, primaryService: { name: "adminService", locator: "apps/admin-web/src/services/adminService.ts#adminService" }, primaryMock: { name: "category Mock", locator: "apps/admin-web/src/mocks/data.ts#L1" }, primaryTest: sharedTest, maturity: "SPECIALIZED",
  financeSafety: { level: "N/A", controls: ["关联完整性", "状态审计"], specializedCapabilities: [] },
});
export const merchantManagementDomain = domain({
  name: "商家管理", slug: "merchant-management", route: "/operations/domains/merchant-management", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#merchantManagementDomain", owner: "商户运营与结算配置负责人",
  primaryPage: { name: "MerchantPage", route: "/merchants", locator: "apps/admin-web/src/pages/MerchantPage.tsx#MerchantPage" }, primaryService: { name: "merchantLifecycleService", locator: "apps/admin-web/src/services/merchantLifecycleService.ts#shopService" }, primaryMock: { name: "merchant lifecycle Mock", locator: "apps/admin-web/src/mocks/data-merchant-lifecycle.ts#L1" }, primaryTest: { name: "settlement rules test", locator: "apps/admin-web/src/services/settlementRules.test.ts#L32" }, maturity: "SPECIALIZED",
  financeSafety: { level: "L", controls: ["分账守恒", "渠道能力保护", "审计"], specializedCapabilities: ["split"] },
});
export const commerceManagementDomain = domain({
  name: "电商管理", slug: "commerce-management", route: "/operations/domains/commerce-management", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#commerceManagementDomain", owner: "电商商品与订单运营负责人",
  primaryPage: { name: "ProductPage", route: "/products", locator: "apps/admin-web/src/pages/ProductPage.tsx#ProductPage" }, primaryService: { name: "adminService", locator: "apps/admin-web/src/services/adminService.ts#adminService" }, primaryMock: { name: "commerce Mock", locator: "apps/admin-web/src/mocks/data.ts#L1" }, primaryTest: { name: "financial domain test", locator: "apps/admin-web/src/domain/v03-domain.test.ts#L17" }, maturity: "SPECIALIZED",
  financeSafety: { level: "L", controls: ["订单支付分离", "整数分", "退款审计"], specializedCapabilities: ["refund"] },
});
export const pointManagementDomain = domain({
  name: "积分管理", slug: "point-management", route: "/operations/domains/point-management", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#pointManagementDomain", owner: "积分运营与资金池负责人",
  primaryPage: { name: "PointGrantPage", route: "/point-grants", locator: "apps/admin-web/src/pages/PointGrantPage.tsx#PointGrantPage" }, primaryService: { name: "pointGrantService", locator: "apps/admin-web/src/services/pointGrantService.ts#createPointGrantService" }, primaryMock: { name: "point Mock", locator: "apps/admin-web/src/mocks/data-v03.ts#L1" }, primaryTest: { name: "point grant test", locator: "apps/admin-web/src/services/pointGrantService.test.ts#L36" }, maturity: "SPECIALIZED",
  financeSafety: { level: "L", controls: ["资金守恒", "幂等发放", "脱敏认领", "对账"], specializedCapabilities: ["pointFundingPool", "pointGrant", "pointRecognition"] },
});
export const couponManagementDomain = domain({
  name: "票券管理", slug: "coupon-management", route: "/operations/domains/coupon-management", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#couponManagementDomain", owner: "票券运营与券资金池负责人",
  primaryPage: { name: "CouponPage", route: "/coupon-templates", locator: "apps/admin-web/src/pages/CouponPage.tsx#CouponPage" }, primaryService: { name: "couponService", locator: "apps/admin-web/src/services/couponService.ts#couponService" }, primaryMock: { name: "coupon Mock", locator: "apps/admin-web/src/mocks/data-coupon.ts#L1" }, primaryTest: { name: "funding pool test", locator: "apps/admin-web/src/services/fundingPoolService.test.ts#L26" }, maturity: "SPECIALIZED",
  financeSafety: { level: "L", controls: ["券锁定释放", "资金责任", "幂等核销", "对账"], specializedCapabilities: ["couponFundingPool"] },
});
export const pointBenefitDomain = domain({
  name: "积分权益", slug: "point-benefits", route: "/operations/domains/point-benefits", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#pointBenefitDomain", owner: "权益运营负责人",
  primaryPage: sharedPage("/operations/domains/point-benefits"), primaryService: sharedService, primaryMock: sharedMock, primaryTest: { name: "UNCONFIRMED guard test", locator: "apps/admin-web/src/services/requirementLedgerService.test.ts#L5" }, maturity: "SHARED",
  financeSafety: { level: "M", controls: ["幂等奖励", "依赖保护"], specializedCapabilities: [] },
});
export const eventRegistrationDomain = domain({
  name: "活动报名", slug: "event-registration", route: "/operations/domains/event-registration", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#eventRegistrationDomain", owner: "活动运营负责人",
  primaryPage: { name: "PlaceholderLedgerPage", route: "/campaigns", locator: "apps/admin-web/src/pages/PlaceholderLedgerPage.tsx#PlaceholderLedgerPage" }, primaryService: sharedService, primaryMock: sharedMock, primaryTest: sharedTest, maturity: "SHARED",
  financeSafety: { level: "N/A", controls: ["核销审计"], specializedCapabilities: [] },
});
export const utilityPaymentDomain = domain({
  name: "生活缴费管理", slug: "utility-payments", route: "/operations/domains/utility-payments", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#utilityPaymentDomain", owner: "生活缴费运营与接口风控负责人",
  primaryPage: { name: "FinancialWorkbenchPage", route: "/financial-workbench", locator: "apps/admin-web/src/pages/FinancialWorkbenchPage.tsx#FinancialWorkbenchPage" }, primaryService: sharedService, primaryMock: sharedMock, primaryTest: { name: "UNCONFIRMED guard test", locator: "apps/admin-web/src/services/requirementLedgerService.test.ts#L5" }, maturity: "BLOCKED",
  financeSafety: { level: "L", controls: ["全部动作禁用", "provider 依赖", "退款对账合同"], specializedCapabilities: [] },
});
export const miniProgramDomain = domain({
  name: "小程序管理", slug: "mini-program-management", route: "/operations/domains/mini-program-management", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#miniProgramDomain", owner: "渠道配置管理员",
  primaryPage: sharedPage("/operations/domains/mini-program-management"), primaryService: sharedService, primaryMock: sharedMock, primaryTest: sharedTest, maturity: "SHARED",
  financeSafety: { level: "N/A", controls: ["凭证不落盘", "状态审计"], specializedCapabilities: [] },
});
export const focusImageDomain = domain({
  name: "焦点图", slug: "focus-images", route: "/operations/domains/focus-images", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#focusImageDomain", owner: "内容投放运营负责人",
  primaryPage: { name: "AdvertisementPage", route: "/ads", locator: "apps/admin-web/src/pages/AdvertisementPage.tsx#AdvertisementPage" }, primaryService: { name: "adminService", locator: "apps/admin-web/src/services/adminService.ts#adminService" }, primaryMock: { name: "advertisement Mock", locator: "apps/admin-web/src/mocks/data.ts#L1" }, primaryTest: sharedTest, maturity: "SPECIALIZED",
  financeSafety: { level: "N/A", controls: ["排期状态审计"], specializedCapabilities: [] },
});
export const platformContentDomain = domain({
  name: "平台协议与常见问题", slug: "platform-content", route: "/operations/domains/platform-content", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#platformContentDomain", owner: "法务内容与客服知识负责人",
  primaryPage: { name: "ContractPage", route: "/contracts", locator: "apps/admin-web/src/pages/ContractPage.tsx#ContractPage" }, primaryService: sharedService, primaryMock: sharedMock, primaryTest: sharedTest, maturity: "SPECIALIZED",
  financeSafety: { level: "N/A", controls: ["版本审计", "安全预览"], specializedCapabilities: [] },
});
export const financeDomain = domain({
  name: "财务管理", slug: "finance", route: "/operations/domains/finance", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#financeDomain", owner: "财务结算与对账负责人",
  primaryPage: { name: "PaymentPage", route: "/payments", locator: "apps/admin-web/src/pages/PaymentPage.tsx#PaymentPage" }, primaryService: { name: "paymentService", locator: "apps/admin-web/src/services/paymentService.ts#paymentService" }, primaryMock: { name: "payment Mock", locator: "apps/admin-web/src/mocks/data-payment.ts#L1" }, primaryTest: { name: "financial domain test", locator: "apps/admin-web/src/domain/v03-domain.test.ts#L17" }, maturity: "SPECIALIZED",
  financeSafety: { level: "L", controls: ["整数分/基点", "幂等", "状态机", "审计", "冲正", "对账"], specializedCapabilities: ["payment", "refund", "split", "settlement", "reconciliation"] },
});
export const systemManagementDomain = domain({
  name: "系统管理", slug: "system-management", route: "/operations/domains/system-management", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#systemManagementDomain", owner: "平台安全与系统管理员",
  primaryPage: { name: "SystemPage", route: "/system", locator: "apps/admin-web/src/pages/SystemPage.tsx#SystemPage" }, primaryService: { name: "adminService", locator: "apps/admin-web/src/services/adminService.ts#adminService" }, primaryMock: { name: "system Mock", locator: "apps/admin-web/src/mocks/data.ts#L1" }, primaryTest: sharedTest, maturity: "SPECIALIZED",
  financeSafety: { level: "M", controls: ["RBAC", "最小权限", "不可变审计"], specializedCapabilities: [] },
});
export const homeServiceDomain = domain({
  name: "到家服务管理", slug: "home-services", route: "/operations/domains/home-services", routeLocator: "apps/admin-web/src/registry/domainCatalog.ts#homeServiceDomain", owner: "到家服务运营与售后负责人",
  primaryPage: sharedPage("/operations/domains/home-services"), primaryService: sharedService, primaryMock: sharedMock, primaryTest: sharedTest, maturity: "SHARED",
  financeSafety: { level: "L", controls: ["订单支付分离", "退款幂等", "状态审计"], specializedCapabilities: ["refund"] },
});

export const DOMAIN_CATALOG: readonly DomainCatalogEntry[] = Object.freeze([
  contentOperationsDomain, userManagementDomain, invoiceLotteryDomain, categoryInformationDomain, merchantManagementDomain,
  commerceManagementDomain, pointManagementDomain, couponManagementDomain, pointBenefitDomain, eventRegistrationDomain,
  utilityPaymentDomain, miniProgramDomain, focusImageDomain, platformContentDomain, financeDomain, systemManagementDomain, homeServiceDomain,
]);

export const FINANCE_SPECIALIZED_CAPABILITIES = {
  payment: { label: "支付", route: "/payments", page: { name: "PaymentPage", locator: "apps/admin-web/src/pages/PaymentPage.tsx#PaymentPage" }, service: { name: "paymentService", locator: "apps/admin-web/src/services/paymentService.ts#paymentService" }, mock: { name: "payment Mock", locator: "apps/admin-web/src/mocks/data-payment.ts#L1" }, test: { name: "v03 Mock service test", locator: "apps/admin-web/src/services/v03MockServices.test.ts#L4" } },
  refund: { label: "退款", route: "/refund", page: { name: "RefundPage", locator: "apps/admin-web/src/pages/RefundPage.tsx#RefundPage" }, service: { name: "adminService", locator: "apps/admin-web/src/services/adminService.ts#adminService" }, mock: { name: "order Mock", locator: "apps/admin-web/src/mocks/data.ts#L1" }, test: { name: "financial domain test", locator: "apps/admin-web/src/domain/v03-domain.test.ts#L17" } },
  split: { label: "分账", route: "/split-instructions", page: { name: "SplitInstructionPage", locator: "apps/admin-web/src/pages/SplitInstructionPage.tsx#SplitInstructionPage" }, service: { name: "v03MockServices", locator: "apps/admin-web/src/services/v03MockServices.ts#v03MockServices" }, mock: { name: "settlement Mock", locator: "apps/admin-web/src/mocks/data-settlement.ts#L1" }, test: { name: "split service test", locator: "apps/admin-web/src/services/splitService.test.ts#L34" } },
  settlement: { label: "结算", route: "/settlement", page: { name: "SettlementPage", locator: "apps/admin-web/src/pages/SettlementPage.tsx#SettlementPage" }, service: { name: "adminService", locator: "apps/admin-web/src/services/adminService.ts#adminService" }, mock: { name: "order Mock", locator: "apps/admin-web/src/mocks/data.ts#L1" }, test: { name: "settlement rules test", locator: "apps/admin-web/src/services/settlementRules.test.ts#L32" } },
  reconciliation: { label: "对账", route: "/reconciliation", page: { name: "ReconciliationPage", locator: "apps/admin-web/src/pages/ReconciliationPage.tsx#ReconciliationPage" }, service: { name: "reconciliationService", locator: "apps/admin-web/src/services/reconciliationService.ts#reconciliationService" }, mock: { name: "reconciliation Mock", locator: "apps/admin-web/src/mocks/data-reconciliation.ts#L1" }, test: { name: "v03 Mock service test", locator: "apps/admin-web/src/services/v03MockServices.test.ts#L4" } },
  pointFundingPool: { label: "积分资金池", route: "/funding-pools/points", page: { name: "FundingPoolPage", locator: "apps/admin-web/src/pages/FundingPoolPage.tsx#FundingPoolPage" }, service: { name: "v03MockServices", locator: "apps/admin-web/src/services/v03MockServices.ts#v03MockServices" }, mock: { name: "v03 Mock", locator: "apps/admin-web/src/mocks/data-v03.ts#L1" }, test: { name: "funding pool test", locator: "apps/admin-web/src/services/fundingPoolService.test.ts#L26" } },
  couponFundingPool: { label: "消费券资金池", route: "/funding-pools/coupons", page: { name: "CouponFundingPoolPage", locator: "apps/admin-web/src/pages/CouponFundingPoolPage.tsx#CouponFundingPoolPage" }, service: { name: "v03MockServices", locator: "apps/admin-web/src/services/v03MockServices.ts#v03MockServices" }, mock: { name: "v03 Mock", locator: "apps/admin-web/src/mocks/data-v03.ts#L1" }, test: { name: "funding pool test", locator: "apps/admin-web/src/services/fundingPoolService.test.ts#L26" } },
  pointGrant: { label: "积分发放", route: "/point-grants", page: { name: "PointGrantPage", locator: "apps/admin-web/src/pages/PointGrantPage.tsx#PointGrantPage" }, service: { name: "v03MockServices", locator: "apps/admin-web/src/services/v03MockServices.ts#v03MockServices" }, mock: { name: "v03 Mock", locator: "apps/admin-web/src/mocks/data-v03.ts#L1" }, test: { name: "point grant test", locator: "apps/admin-web/src/services/pointGrantService.test.ts#L36" } },
  pointRecognition: { label: "积分认领", route: "/pending-points", page: { name: "PendingPointPage", locator: "apps/admin-web/src/pages/PendingPointPage.tsx#PendingPointPage" }, service: { name: "v03MockServices", locator: "apps/admin-web/src/services/v03MockServices.ts#v03MockServices" }, mock: { name: "v03 Mock", locator: "apps/admin-web/src/mocks/data-v03.ts#L1" }, test: { name: "point grant test", locator: "apps/admin-web/src/services/pointGrantService.test.ts#L36" } },
} as const satisfies Record<string, SpecializedCapability>;

export function getDomainBySlug(slug: string): DomainCatalogEntry | undefined {
  return DOMAIN_CATALOG.find((domainEntry) => domainEntry.slug === slug);
}

export function getDomainForRequirement(id: string): DomainCatalogEntry | undefined {
  return DOMAIN_CATALOG.find((domainEntry) => domainEntry.requirementIds.includes(id));
}

export function getRequirementDomain(item: Pick<PcRequirement, "id">): DomainCatalogEntry {
  const found = getDomainForRequirement(item.id);
  if (!found) throw new Error(`需求 ${item.id} 未绑定 17 域 catalog`);
  return found;
}
