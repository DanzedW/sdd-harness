import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const source = JSON.parse(readFileSync("experiment/requirements.pc.json", "utf8"));
const L = (path, symbol) => `${path}#${symbol}`;
const shared = { page: L("apps/admin-web/src/pages/OperationsRegistryPage.tsx", "OperationsRegistryPage"), service: L("apps/admin-web/src/services/operationsService.ts", "operationsService"), test: "apps/admin-web/src/operations/registry.test.ts#L4", mock: L("apps/admin-web/src/operations/registry.ts", "OPERATION_REQUIREMENTS"), maturity: "IMPLEMENTED_SHARED" };
const evidence = {
  "内容运营": { slug: "content", owner: "内容运营负责人", ...shared },
  "用户管理": { slug: "users", owner: "用户运营与风控负责人", page: L("apps/admin-web/src/pages/UserPage.tsx", "UserPage"), service: L("apps/admin-web/src/services/adminService.ts", "adminService"), test: "apps/admin-web/src/services/operationsService.test.ts#L4", mock: L("apps/admin-web/src/mocks/data.ts", "users"), maturity: "IMPLEMENTED_SHARED" },
  "发票抽奖": { slug: "invoice-lottery", owner: "活动运营与财务风控负责人", ...shared, test: "apps/admin-web/src/operations/policies.test.ts#L4" },
  "分类信息": { slug: "classified-information", owner: "分类内容运营负责人", page: L("apps/admin-web/src/pages/CategoryPage.tsx", "CategoryPage"), service: L("apps/admin-web/src/services/adminService.ts", "adminService"), test: "apps/admin-web/src/operations/registry.test.ts#L4", mock: L("apps/admin-web/src/mocks/data.ts", "categories"), maturity: "IMPLEMENTED_SHARED" },
  "商家管理": { slug: "merchants", owner: "商户运营与结算配置负责人", page: L("apps/admin-web/src/pages/MerchantPage.tsx", "MerchantPage"), service: L("apps/admin-web/src/services/adminService.ts", "adminService"), test: "apps/admin-web/src/services/settlementRules.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-merchant-lifecycle.ts", "contracts"), maturity: "IMPLEMENTED_SHARED" },
  "电商管理": { slug: "commerce", owner: "商品与订单运营负责人", page: L("apps/admin-web/src/pages/OrderPage.tsx", "OrderPage"), service: L("apps/admin-web/src/services/adminService.ts", "adminService"), test: "apps/admin-web/src/pages/v03Ui.test.ts#L1", mock: L("apps/admin-web/src/mocks/data.ts", "orders"), maturity: "IMPLEMENTED_SHARED" },
  "积分管理": { slug: "points", owner: "积分运营与资金负责人", page: L("apps/admin-web/src/pages/FundingPoolPage.tsx", "FundingPoolPage"), service: L("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), test: "apps/admin-web/src/services/v03MockServices.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-v03.ts", "v03FundingPools"), maturity: "IMPLEMENTED_SPECIALIZED" },
  "票券管理": { slug: "vouchers", owner: "票券运营与资金负责人", page: L("apps/admin-web/src/pages/CouponFundingPoolPage.tsx", "CouponFundingPoolPage"), service: L("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), test: "apps/admin-web/src/services/v03MockServices.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-v03.ts", "v03CouponFundingBatches"), maturity: "IMPLEMENTED_SPECIALIZED" },
  "积分权益": { slug: "point-benefits", owner: "会员权益运营负责人", page: L("apps/admin-web/src/pages/CoinRecordPage.tsx", "CoinRecordPage"), service: L("apps/admin-web/src/services/coinService.ts", "coinService"), test: "apps/admin-web/src/operations/policies.test.ts#L4", mock: L("apps/admin-web/src/mocks/data-v03.ts", "v03FundingPools"), maturity: "IMPLEMENTED_SHARED" },
  "活动报名": { slug: "events", owner: "活动运营负责人", ...shared },
  "生活缴费管理": { slug: "utility-payments", owner: "生活缴费集成与财务负责人", ...shared, test: "apps/admin-web/src/operations/policies.test.ts#L4" },
  "小程序管理": { slug: "mini-program", owner: "客户端运营负责人", ...shared },
  "焦点图": { slug: "banners", owner: "内容展示运营负责人", page: L("apps/admin-web/src/pages/AdvertisementPage.tsx", "AdvertisementPage"), service: L("apps/admin-web/src/services/adminService.ts", "adminService"), test: "apps/admin-web/src/operations/registry.test.ts#L4", mock: L("apps/admin-web/src/mocks/data.ts", "advertisements"), maturity: "IMPLEMENTED_SHARED" },
  "平台协议与常见问题": { slug: "agreements-and-faq", owner: "法务内容与客服运营负责人", page: L("apps/admin-web/src/pages/ContractPage.tsx", "ContractPage"), service: L("apps/admin-web/src/services/merchantLifecycleService.ts", "contractService"), test: "apps/admin-web/src/mocks/privacy.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-merchant-lifecycle.ts", "contracts"), maturity: "IMPLEMENTED_SHARED" },
  "财务管理": { slug: "finance", owner: "财务、结算与对账负责人", page: L("apps/admin-web/src/pages/PaymentPage.tsx", "PaymentPage"), service: L("apps/admin-web/src/services/paymentService.ts", "paymentService"), test: "apps/admin-web/src/services/v03MockServices.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-payment.ts", "payments"), maturity: "IMPLEMENTED_SHARED" },
  "系统管理": { slug: "system", owner: "平台管理员与安全负责人", page: L("apps/admin-web/src/pages/SystemPage.tsx", "SystemPage"), service: L("apps/admin-web/src/services/adminService.ts", "adminService"), test: "apps/admin-web/src/mocks/privacy.test.ts#L1", mock: L("apps/admin-web/src/mocks/data.ts", "adminAccounts"), maturity: "IMPLEMENTED_SHARED" },
  "到家服务管理": { slug: "home-services", owner: "到家服务履约负责人", ...shared, test: "apps/admin-web/src/pages/v03Ui.test.ts#L1" }
};

function specialize(item, base) {
  const text = `${item.module}${item.detail.split("运营后台")[0]}`;
  if (/分账/.test(text)) return { ...base, page: L("apps/admin-web/src/pages/SplitInstructionPage.tsx", "SplitInstructionPage"), service: L("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), test: "apps/admin-web/src/services/v03MockServices.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-v03.ts", "v03SplitInstructions"), maturity: "IMPLEMENTED_SPECIALIZED" };
  if (/对账/.test(text)) return { ...base, page: L("apps/admin-web/src/pages/ReconciliationPage.tsx", "ReconciliationPage"), service: L("apps/admin-web/src/services/reconciliationService.ts", "reconciliationService"), test: "apps/admin-web/src/services/v03MockServices.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-reconciliation.ts", "reconciliationRecords"), maturity: "IMPLEMENTED_SHARED" };
  if (/退款|售后/.test(text)) return { ...base, page: L("apps/admin-web/src/pages/RefundPage.tsx", "RefundPage"), service: L("apps/admin-web/src/services/adminService.ts", "adminService"), test: "apps/admin-web/src/operations/registry.test.ts#L4", mock: L("apps/admin-web/src/mocks/data.ts", "orders"), maturity: "IMPLEMENTED_SHARED" };
  if (/消费券资金池|票券资金池/.test(text)) return { ...base, page: L("apps/admin-web/src/pages/CouponFundingPoolPage.tsx", "CouponFundingPoolPage"), service: L("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), test: "apps/admin-web/src/services/v03MockServices.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-v03.ts", "v03CouponFundingBatches"), maturity: "IMPLEMENTED_SPECIALIZED" };
  if (/积分资金池/.test(text)) return { ...base, page: L("apps/admin-web/src/pages/FundingPoolPage.tsx", "FundingPoolPage"), service: L("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), test: "apps/admin-web/src/services/v03MockServices.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-v03.ts", "v03FundingPools"), maturity: "IMPLEMENTED_SPECIALIZED" };
  if (/积分发放|发放记录/.test(text)) return { ...base, page: L("apps/admin-web/src/pages/PointGrantPage.tsx", "PointGrantPage"), service: L("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), test: "apps/admin-web/src/services/v03MockServices.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-v03.ts", "v03FundingPools"), maturity: "IMPLEMENTED_SPECIALIZED" };
  if (/不足|待认领/.test(text) && item.group === "积分管理") return { ...base, page: L("apps/admin-web/src/pages/PendingPointPage.tsx", "PendingPointPage"), service: L("apps/admin-web/src/services/v03MockServices.ts", "v03MockServices"), test: "apps/admin-web/src/services/v03MockServices.test.ts#L1", mock: L("apps/admin-web/src/mocks/data-v03.ts", "v03FundingPools"), maturity: "IMPLEMENTED_SPECIALIZED" };
  if (/结算|提现/.test(text) && item.group === "财务管理") return { ...base, page: L("apps/admin-web/src/pages/SettlementPage.tsx", "SettlementPage"), service: L("apps/admin-web/src/services/adminService.ts", "adminService"), test: "apps/admin-web/src/operations/registry.test.ts#L4", mock: L("apps/admin-web/src/mocks/data-settlement.ts", "settlements"), maturity: "IMPLEMENTED_SHARED" };
  return base;
}

const records = source.requirements.map((item, index) => {
  const domain = specialize(item, evidence[item.group]);
  const semanticAllowlist = new Set(["PC-113", "PC-114"]);
  const maturity = semanticAllowlist.has(item.id) ? "IMPLEMENTED_SPECIALIZED" : "IMPLEMENTED_SHARED";
  const status = item.unconfirmed ? "UNCONFIRMED_ACTION_DISABLED" : maturity;
  const canonical = {
    id: item.id,
    source: `docs/requirements/数字生活与支付底层平台-融合功能清单-V1.4-扩写版.xlsx#L${item.excelRow}`,
    sourceSha256: item.sourceSha256,
    AC: item.unconfirmed ? "共享台账仅查询/详情；领域动作未确认且不存在通用mutation" : domain.maturity === "IMPLEMENTED_SPECIALIZED" ? "现有page-facing facade与测试证明该专用能力链" : "现有页面可导航或查询；独立领域语义尚未由integration test证明",
    owner: domain.owner,
    route: `/operations/${domain.slug}`,
    page: domain.page,
    service: domain.service,
    mock: domain.mock,
    test: domain.test,
    verifier: "pnpm --filter admin-web test --run && pnpm typecheck && pnpm build",
    status
  };
  return { ...canonical, evidenceHash: createHash("sha256").update(JSON.stringify(canonical)).digest("hex") };
});

mkdirSync("docs/delivery", { recursive: true });
writeFileSync("docs/delivery/requirements-traceability.json", `${JSON.stringify({ schemaVersion: 2, scope: "PC-080..PC-172", total: records.length, unconfirmed: records.filter((row) => row.status === "UNCONFIRMED_ACTION_DISABLED").length, records }, null, 2)}\n`);

