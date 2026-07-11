import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdvertisementPage } from "./pages/AdvertisementPage";
import { CategoryPage } from "./pages/CategoryPage";
import CoinRecordPage from "./pages/CoinRecordPage";
import ContractPage from "./pages/ContractPage";
import CouponPage from "./pages/CouponPage";
import { DashboardPage } from "./pages/DashboardPage";
import LedgerPage from "./pages/LedgerPage";
import { LogisticsPage } from "./pages/LogisticsPage";
import { LoginPage } from "./pages/LoginPage";
import { MerchantPage } from "./pages/MerchantPage";
import { OrderPage } from "./pages/OrderPage";
import PaymentPage from "./pages/PaymentPage";
import { PlaceholderLedgerPage } from "./pages/PlaceholderLedgerPage";
import { ProductPage } from "./pages/ProductPage";
import { ProductEditPage } from "./pages/ProductEditPage";
import QrCodePage from "./pages/QrCodePage";
import ReconciliationPage from "./pages/ReconciliationPage";
import { RefundPage } from "./pages/RefundPage";
import ScanPayPage from "./pages/ScanPayPage";
import { SettlementPage } from "./pages/SettlementPage";
import { SettlementProfilePage } from "./pages/SettlementProfilePage";
import { SplitInstructionPage } from "./pages/SplitInstructionPage";
import { FundingPoolPage } from "./pages/FundingPoolPage";
import { PointGrantPage } from "./pages/PointGrantPage";
import { PendingPointPage } from "./pages/PendingPointPage";
import { CouponFundingPoolPage } from "./pages/CouponFundingPoolPage";
import ShopPage from "./pages/ShopPage";
import { SystemPage } from "./pages/SystemPage";
import { UserPage } from "./pages/UserPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

function RequireAuth() {
  const token = localStorage.getItem("admin-token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#2563eb",
          borderRadius: 4,
        },
      }}
    >
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UserPage />} />
              <Route path="/categories" element={<CategoryPage />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/products/new" element={<ProductEditPage />} />
              <Route path="/products/:id/edit" element={<ProductEditPage />} />
              <Route path="/orders" element={<OrderPage />} />
              <Route path="/settlement" element={<SettlementPage />} />
              <Route path="/settlement-profiles" element={<SettlementProfilePage />} />
              <Route path="/split-instructions" element={<SplitInstructionPage />} />
              <Route path="/funding-pools/points" element={<FundingPoolPage />} />
              <Route path="/point-grants" element={<PointGrantPage />} />
              <Route path="/pending-points" element={<PendingPointPage />} />
              <Route path="/funding-pools/coupons" element={<CouponFundingPoolPage />} />
              <Route path="/payments" element={<PaymentPage />} />
              <Route path="/ledger" element={<LedgerPage />} />
              <Route path="/refund" element={<RefundPage />} />
              <Route path="/reconciliation" element={<ReconciliationPage />} />
              <Route path="/logistics" element={<LogisticsPage />} />
              <Route path="/merchants" element={<MerchantPage />} />
              <Route
                path="/merchants/audit"
                element={
                  <PlaceholderLedgerPage
                    parentName="商户管理"
                    moduleName="商户审核"
                    source="数字供应链平台 / 平台商户端 / 企业认证、我要开店"
                    phase="一期"
                    scope="沉淀待审核商户台账，后续复用商户列表的审核动作和资质详情。"
                  />
                }
              />
              <Route path="/ads" element={<AdvertisementPage />} />
              <Route path="/system" element={<SystemPage />} />
              <Route
                path="/freight-templates"
                element={
                  <PlaceholderLedgerPage
                    parentName="商品管理"
                    moduleName="运费模板"
                    source="数字生活平台后台系统（web）/ 会员服务商城后台 / 运费模板"
                    phase="一期"
                    scope="模板列表、查看、新增、编辑、删除，供实物商品选择。"
                  />
                }
              />
              <Route
                path="/merchant-income"
                element={
                  <PlaceholderLedgerPage
                    parentName="财务管理"
                    moduleName="商家收入"
                    source="数字供应链平台 / 平台管理端 / 财务管理"
                    phase="一期"
                    scope="按商家和时间查询收入台账，承接结算清单和商家收入列表。"
                  />
                }
              />
              <Route
                path="/settlement-config"
                element={
                  <PlaceholderLedgerPage
                    parentName="财务管理"
                    moduleName="结算配置"
                    source="数字供应链平台 / 平台管理端 / 商家结算配置"
                    phase="二期"
                    scope="维护商户号配置和结算参数，资金链路上线前补充审计、幂等和对账方案。"
                  />
                }
              />
              <Route
                path="/campaigns"
                element={
                  <PlaceholderLedgerPage
                    parentName="营销运营"
                    moduleName="营销活动"
                    source="数字生活平台后台系统（web）/ 会员服务商城后台 / 营销管理"
                    phase="一期"
                    scope="配置活动时间、活动形式、参与商品和编辑修改入口。"
                  />
                }
              />
              <Route path="/coupon-templates" element={<CouponPage />} />
              <Route path="/coin-records" element={<CoinRecordPage />} />
              <Route path="/contracts" element={<ContractPage />} />
              <Route path="/shops" element={<ShopPage />} />
              <Route path="/qrcodes" element={<QrCodePage />} />
              <Route path="/scan-pay" element={<ScanPayPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ErrorBoundary>
    </ConfigProvider>
  );
}
