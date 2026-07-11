import { OPERATION_REQUIREMENTS } from "./registry";

export type DomainMaturity = "IMPLEMENTED_SHARED" | "IMPLEMENTED_SPECIALIZED";
export type FinanceSafetyLevel = "NONE" | "READ_ONLY" | "HIGH" | "CRITICAL" | "GOVERNANCE";

export interface SpecializedCapability {
  name: string;
  route: string;
  page: string;
  service: string;
  test: string;
}

export interface OperationDomainCatalogEntry {
  name: string;
  slug: string;
  route: string;
  owner: string;
  requirementIds: string[];
  primaryPage: string;
  primaryService: string;
  primaryTest: string;
  primaryMock: string;
  maturity: DomainMaturity;
  financeSafety: { level: FinanceSafetyLevel; controls: string[]; dedicatedRequired: boolean };
  specializedCapabilities: SpecializedCapability[];
}

type DomainSeed = Omit<OperationDomainCatalogEntry, "requirementIds" | "route">;
const loc = (path: string, symbol: string) => `${path}#${symbol}`;
const sharedPage = loc("apps/admin-web/src/pages/OperationsRegistryPage.tsx", "OperationsRegistryPage");
const sharedService = loc("apps/admin-web/src/services/operationsService.ts", "operationsService");
const registryTest = "apps/admin-web/src/operations/registry.test.ts#L4";
const policyTest = "apps/admin-web/src/operations/policies.test.ts#L4";
const registryMock = loc("apps/admin-web/src/operations/registry.ts", "OPERATION_REQUIREMENTS");
const capability = (name: string, route: string, page: string, service: string, test: string): SpecializedCapability => ({ name, route, page, service, test });

const seeds: DomainSeed[] = [
  { name: "内容运营", slug: "content", owner: "内容运营负责人", primaryPage: sharedPage, primaryService: sharedService, primaryTest: registryTest, primaryMock: registryMock, maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "NONE", controls: [], dedicatedRequired: false }, specializedCapabilities: [] },
  { name: "用户管理", slug: "users", owner: "用户运营与风控负责人", primaryPage: loc("apps/admin-web/src/pages/UserPage.tsx", "UserPage"), primaryService: loc("apps/admin-web/src/services/adminService.ts", "adminService"), primaryTest: "apps/admin-web/src/services/operationsService.test.ts#L4", primaryMock: loc("apps/admin-web/src/mocks/data.ts", "users"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "READ_ONLY", controls: ["关联资金事实只读", "敏感字段脱敏"], dedicatedRequired: false }, specializedCapabilities: [] },
  { name: "发票抽奖", slug: "invoice-lottery", owner: "活动运营与财务风控负责人", primaryPage: sharedPage, primaryService: sharedService, primaryTest: policyTest, primaryMock: registryMock, maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "HIGH", controls: ["奖励积分幂等", "奖池整数分", "验真失败原因"], dedicatedRequired: true }, specializedCapabilities: [capability("积分发放", "/point-grants", loc("apps/admin-web/src/pages/PointGrantPage.tsx", "PointGrantPage"), loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), "apps/admin-web/src/services/v03MockServices.test.ts#L1")] },
  { name: "分类信息", slug: "classified-information", owner: "分类内容运营负责人", primaryPage: loc("apps/admin-web/src/pages/CategoryPage.tsx", "CategoryPage"), primaryService: loc("apps/admin-web/src/services/adminService.ts", "adminService"), primaryTest: registryTest, primaryMock: loc("apps/admin-web/src/mocks/data.ts", "categories"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "NONE", controls: [], dedicatedRequired: false }, specializedCapabilities: [] },
  { name: "商家管理", slug: "merchants", owner: "商户运营与结算配置负责人", primaryPage: loc("apps/admin-web/src/pages/MerchantPage.tsx", "MerchantPage"), primaryService: loc("apps/admin-web/src/services/adminService.ts", "adminService"), primaryTest: "apps/admin-web/src/services/settlementRules.test.ts#L1", primaryMock: loc("apps/admin-web/src/mocks/data-merchant-lifecycle.ts", "contracts"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "HIGH", controls: ["分账比例整数基点", "协议版本快照", "收款码状态审计"], dedicatedRequired: true }, specializedCapabilities: [capability("分账", "/split-instructions", loc("apps/admin-web/src/pages/SplitInstructionPage.tsx", "SplitInstructionPage"), loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), "apps/admin-web/src/services/v03MockServices.test.ts#L1")] },
  { name: "电商管理", slug: "commerce", owner: "商品与订单运营负责人", primaryPage: loc("apps/admin-web/src/pages/OrderPage.tsx", "OrderPage"), primaryService: loc("apps/admin-web/src/services/adminService.ts", "adminService"), primaryTest: "apps/admin-web/src/pages/v03Ui.test.ts#L1", primaryMock: loc("apps/admin-web/src/mocks/data.ts", "orders"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "HIGH", controls: ["订单支付分离", "退款幂等", "金额快照"], dedicatedRequired: true }, specializedCapabilities: [capability("退款", "/refund", loc("apps/admin-web/src/pages/RefundPage.tsx", "RefundPage"), loc("apps/admin-web/src/services/adminService.ts", "adminService"), "apps/admin-web/src/services/v03MockServices.test.ts#L1")] },
  { name: "积分管理", slug: "points", owner: "积分运营与资金负责人", primaryPage: loc("apps/admin-web/src/pages/FundingPoolPage.tsx", "FundingPoolPage"), primaryService: loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), primaryTest: "apps/admin-web/src/services/v03MockServices.test.ts#L1", primaryMock: loc("apps/admin-web/src/mocks/data-v03.ts", "v03FundingPools"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "CRITICAL", controls: ["整数分", "幂等发放", "余额守恒", "待认领", "对账状态"], dedicatedRequired: true }, specializedCapabilities: [
    capability("积分资金池", "/funding-pools/points", loc("apps/admin-web/src/pages/FundingPoolPage.tsx", "FundingPoolPage"), loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), "apps/admin-web/src/services/v03MockServices.test.ts#L1"),
    capability("积分发放", "/point-grants", loc("apps/admin-web/src/pages/PointGrantPage.tsx", "PointGrantPage"), loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), "apps/admin-web/src/services/v03MockServices.test.ts#L1"),
    capability("积分认领", "/pending-points", loc("apps/admin-web/src/pages/PendingPointPage.tsx", "PendingPointPage"), loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), "apps/admin-web/src/services/v03MockServices.test.ts#L1"),
  ] },
  { name: "票券管理", slug: "vouchers", owner: "票券运营与资金负责人", primaryPage: loc("apps/admin-web/src/pages/CouponFundingPoolPage.tsx", "CouponFundingPoolPage"), primaryService: loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), primaryTest: "apps/admin-web/src/services/v03MockServices.test.ts#L1", primaryMock: loc("apps/admin-web/src/mocks/data-v03.ts", "v03CouponFundingBatches"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "CRITICAL", controls: ["券生命周期", "核销幂等", "释放与退回", "资金池对账"], dedicatedRequired: true }, specializedCapabilities: [capability("消费券资金池", "/funding-pools/coupons", loc("apps/admin-web/src/pages/CouponFundingPoolPage.tsx", "CouponFundingPoolPage"), loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), "apps/admin-web/src/services/v03MockServices.test.ts#L1")] },
  { name: "积分权益", slug: "point-benefits", owner: "会员权益运营负责人", primaryPage: loc("apps/admin-web/src/pages/CoinRecordPage.tsx", "CoinRecordPage"), primaryService: loc("apps/admin-web/src/services/coinService.ts", "coinService"), primaryTest: policyTest, primaryMock: loc("apps/admin-web/src/mocks/data-v03.ts", "v03FundingPools"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "HIGH", controls: ["奖励积分幂等", "规则版本", "发放审计"], dedicatedRequired: true }, specializedCapabilities: [] },
  { name: "活动报名", slug: "events", owner: "活动运营负责人", primaryPage: sharedPage, primaryService: sharedService, primaryTest: registryTest, primaryMock: registryMock, maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "NONE", controls: [], dedicatedRequired: false }, specializedCapabilities: [] },
  { name: "生活缴费管理", slug: "utility-payments", owner: "生活缴费集成与财务负责人", primaryPage: sharedPage, primaryService: sharedService, primaryTest: policyTest, primaryMock: registryMock, maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "CRITICAL", controls: ["第三方流水", "整数分", "退款冲正", "对账状态"], dedicatedRequired: true }, specializedCapabilities: [capability("对账", "/reconciliation", loc("apps/admin-web/src/pages/ReconciliationPage.tsx", "ReconciliationPage"), loc("apps/admin-web/src/services/reconciliationService.ts", "reconciliationService"), "apps/admin-web/src/services/v03MockServices.test.ts#L1")] },
  { name: "小程序管理", slug: "mini-program", owner: "客户端运营负责人", primaryPage: sharedPage, primaryService: sharedService, primaryTest: registryTest, primaryMock: registryMock, maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "NONE", controls: [], dedicatedRequired: false }, specializedCapabilities: [] },
  { name: "焦点图", slug: "banners", owner: "内容展示运营负责人", primaryPage: loc("apps/admin-web/src/pages/AdvertisementPage.tsx", "AdvertisementPage"), primaryService: loc("apps/admin-web/src/services/adminService.ts", "adminService"), primaryTest: registryTest, primaryMock: loc("apps/admin-web/src/mocks/data.ts", "advertisements"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "NONE", controls: [], dedicatedRequired: false }, specializedCapabilities: [] },
  { name: "平台协议与常见问题", slug: "agreements-and-faq", owner: "法务内容与客服运营负责人", primaryPage: loc("apps/admin-web/src/pages/ContractPage.tsx", "ContractPage"), primaryService: loc("apps/admin-web/src/services/merchantLifecycleService.ts", "contractService"), primaryTest: "apps/admin-web/src/mocks/privacy.test.ts#L1", primaryMock: loc("apps/admin-web/src/mocks/data-merchant-lifecycle.ts", "contracts"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "READ_ONLY", controls: ["交易规则版本不可回写历史"], dedicatedRequired: false }, specializedCapabilities: [] },
  { name: "财务管理", slug: "finance", owner: "财务、结算与对账负责人", primaryPage: loc("apps/admin-web/src/pages/PaymentPage.tsx", "PaymentPage"), primaryService: loc("apps/admin-web/src/services/paymentService.ts", "paymentService"), primaryTest: "apps/admin-web/src/services/v03MockServices.test.ts#L1", primaryMock: loc("apps/admin-web/src/mocks/data-payment.ts", "payments"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "CRITICAL", controls: ["订单支付分离", "整数分与基点", "幂等", "部分成功保真", "冲正", "审计", "多账对账"], dedicatedRequired: true }, specializedCapabilities: [
    capability("支付", "/payments", loc("apps/admin-web/src/pages/PaymentPage.tsx", "PaymentPage"), loc("apps/admin-web/src/services/paymentService.ts", "paymentService"), "apps/admin-web/src/services/v03MockServices.test.ts#L1"),
    capability("退款", "/refund", loc("apps/admin-web/src/pages/RefundPage.tsx", "RefundPage"), loc("apps/admin-web/src/services/adminService.ts", "adminService"), "apps/admin-web/src/services/v03MockServices.test.ts#L1"),
    capability("分账", "/split-instructions", loc("apps/admin-web/src/pages/SplitInstructionPage.tsx", "SplitInstructionPage"), loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), "apps/admin-web/src/services/v03MockServices.test.ts#L1"),
    capability("结算", "/settlement", loc("apps/admin-web/src/pages/SettlementPage.tsx", "SettlementPage"), loc("apps/admin-web/src/services/adminService.ts", "adminService"), "apps/admin-web/src/services/settlementRules.test.ts#L1"),
    capability("对账", "/reconciliation", loc("apps/admin-web/src/pages/ReconciliationPage.tsx", "ReconciliationPage"), loc("apps/admin-web/src/services/reconciliationService.ts", "reconciliationService"), "apps/admin-web/src/services/v03MockServices.test.ts#L1"),
  ] },
  { name: "系统管理", slug: "system", owner: "平台管理员与安全负责人", primaryPage: loc("apps/admin-web/src/pages/SystemPage.tsx", "SystemPage"), primaryService: loc("apps/admin-web/src/services/adminService.ts", "adminService"), primaryTest: "apps/admin-web/src/mocks/privacy.test.ts#L1", primaryMock: loc("apps/admin-web/src/mocks/data.ts", "adminAccounts"), maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "GOVERNANCE", controls: ["职责分离", "关键动作审计", "日志不可直接修改"], dedicatedRequired: true }, specializedCapabilities: [] },
  { name: "到家服务管理", slug: "home-services", owner: "到家服务履约负责人", primaryPage: sharedPage, primaryService: sharedService, primaryTest: "apps/admin-web/src/pages/v03Ui.test.ts#L1", primaryMock: registryMock, maturity: "IMPLEMENTED_SHARED", financeSafety: { level: "HIGH", controls: ["订单与履约分离", "退款幂等", "异常原因"], dedicatedRequired: true }, specializedCapabilities: [] },
];

export const DOMAIN_CATALOG: OperationDomainCatalogEntry[] = seeds.map((seed) => ({
  ...seed,
  route: `/operations/${seed.slug}`,
  requirementIds: OPERATION_REQUIREMENTS.filter((item) => item.group === seed.name).map((item) => item.id),
}));

export const getDomainBySlug = (slug?: string) => DOMAIN_CATALOG.find((domain) => domain.slug === slug);
export const getDomainByName = (name?: string) => DOMAIN_CATALOG.find((domain) => domain.name === name);

// ── 资金专用能力索引（FinancialWorkbenchPage 使用）────────────────
// 从 DOMAIN_CATALOG 的 specializedCapabilities 汇总去重，供资金工作台
// 统一呈现所有与资金链路绑定的专用页面入口。
export const FINANCE_CAPABILITIES: SpecializedCapability[] = [
  { name: "支付",        route: "/payments",           page: loc("apps/admin-web/src/pages/PaymentPage.tsx", "PaymentPage"),              service: loc("apps/admin-web/src/services/paymentService.ts", "paymentService"),            test: "apps/admin-web/src/services/v03MockServices.test.ts#L1" },
  { name: "退款",        route: "/refund",              page: loc("apps/admin-web/src/pages/RefundPage.tsx", "RefundPage"),                  service: loc("apps/admin-web/src/services/adminService.ts", "adminService"),               test: "apps/admin-web/src/services/splitService.test.ts#L1" },
  { name: "分账",        route: "/split-instructions",  page: loc("apps/admin-web/src/pages/SplitInstructionPage.tsx", "SplitInstructionPage"), service: loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"),    test: "apps/admin-web/src/services/splitService.test.ts#L1" },
  { name: "结算",        route: "/settlement",          page: loc("apps/admin-web/src/pages/SettlementPage.tsx", "SettlementPage"),          service: loc("apps/admin-web/src/services/adminService.ts", "adminService"),               test: "apps/admin-web/src/services/settlementRules.test.ts#L1" },
  { name: "对账",        route: "/reconciliation",      page: loc("apps/admin-web/src/pages/ReconciliationPage.tsx", "ReconciliationPage"),  service: loc("apps/admin-web/src/services/reconciliationService.ts", "reconciliationService"), test: "apps/admin-web/src/services/v03MockServices.test.ts#L1" },
  { name: "积分资金池",   route: "/funding-pools/points", page: loc("apps/admin-web/src/pages/FundingPoolPage.tsx", "FundingPoolPage"),        service: loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"),        test: "apps/admin-web/src/services/fundingPoolService.test.ts#L1" },
  { name: "消费券资金池", route: "/funding-pools/coupons",page: loc("apps/admin-web/src/pages/CouponFundingPoolPage.tsx", "CouponFundingPoolPage"), service: loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), test: "apps/admin-web/src/services/fundingPoolService.test.ts#L1" },
  { name: "积分发放",     route: "/point-grants",        page: loc("apps/admin-web/src/pages/PointGrantPage.tsx", "PointGrantPage"),          service: loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"),        test: "apps/admin-web/src/services/pointGrantService.test.ts#L1" },
  { name: "积分认领",     route: "/pending-points",      page: loc("apps/admin-web/src/pages/PendingPointPage.tsx", "PendingPointPage"),      service: loc("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"),        test: "apps/admin-web/src/services/pointGrantService.test.ts#L1" },
];
