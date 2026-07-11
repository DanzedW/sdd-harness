import {
  AppstoreOutlined,
  BankOutlined,
  BarsOutlined,
  FileTextOutlined,
  DashboardOutlined,
  DollarOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  OrderedListOutlined,
  PictureOutlined,
  ShopOutlined,
  TagsOutlined,
  TeamOutlined,
  TruckOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { DOMAIN_CATALOG } from "../registry/domainCatalog";

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps["items"] = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "首页" },
  {
    key: "pc-ledger",
    icon: <BarsOutlined />,
    label: "PC 功能台账（17域）",
    children: [
      { key: "/operations", label: "全部 93 条" },
      ...DOMAIN_CATALOG.map((domain) => ({ key: domain.route, label: domain.name })),
      { key: "/financial-workbench", label: "资金专用工作台" },
    ],
  },
  {
    key: "merchant",
    icon: <BankOutlined />,
    label: "商户管理",
    children: [
      { key: "/merchants", label: "商户列表" },
      { key: "/merchants/audit", label: "商户审核" },
    ],
  },
  {
    key: "goods",
    icon: <ShopOutlined />,
    label: "商品管理",
    children: [
      { key: "/products", label: "商品列表" },
      { key: "/categories", label: "分类管理" },
      { key: "/freight-templates", label: "运费模板" },
    ],
  },
  {
    key: "orders",
    icon: <OrderedListOutlined />,
    label: "订单管理",
    children: [
      { key: "/orders", label: "订单列表" },
      { key: "/refund", label: "退款管理" },
      { key: "/logistics", label: "物流管理" },
    ],
  },
  {
    key: "unified-settlement-v03",
    icon: <DollarOutlined />,
    label: "统一结算 V0.3",
    children: [
      { key: "/settlement-profiles", label: "商户结算画像" },
      { key: "/split-instructions", label: "分账台账" },
      { key: "/funding-pools/points", label: "积分资金池" },
      { key: "/point-grants", label: "积分批量发放" },
      { key: "/pending-points", label: "待认领积分" },
      { key: "/funding-pools/coupons", label: "消费券资金池" },
    ],
  },
  {
    key: "finance",
    icon: <DollarOutlined />,
    label: "财务管理",
    children: [
      { key: "/settlement", label: "结算管理" },
      { key: "/merchant-income", label: "商家收入" },
      { key: "/settlement-config", label: "结算配置" },
    ],
  },
  {
    key: "marketing",
    icon: <PictureOutlined />,
    label: "营销运营",
    children: [
      { key: "/ads", label: "广告管理" },
      { key: "/campaigns", label: "营销活动" },
      { key: "/coupon-templates", label: "券模板" },
    ],
  },
  {
    key: "system",
    icon: <AppstoreOutlined />,
    label: "系统管理",
    children: [
      { key: "/users", icon: <TeamOutlined />, label: "用户管理" },
      { key: "/system", icon: <BarsOutlined />, label: "人员角色" },
      { key: "/contracts", icon: <FileTextOutlined />, label: "合同管理" },
    ],
  },
];

const routeParentKey: Record<string, string> = {
  "/operations": "pc-ledger",
  "/financial-workbench": "pc-ledger",
  "/merchants": "merchant",
  "/merchants/audit": "merchant",
  "/products": "goods",
  "/products/new": "goods",
  "/categories": "goods",
  "/freight-templates": "goods",
  "/orders": "orders",
  "/refund": "orders",
  "/logistics": "orders",
  "/settlement": "finance",
  "/settlement-profiles": "unified-settlement-v03",
  "/split-instructions": "unified-settlement-v03",
  "/funding-pools/points": "unified-settlement-v03",
  "/point-grants": "unified-settlement-v03",
  "/pending-points": "unified-settlement-v03",
  "/funding-pools/coupons": "unified-settlement-v03",
  "/merchant-income": "finance",
  "/settlement-config": "finance",
  "/ads": "marketing",
  "/campaigns": "marketing",
  "/coupon-templates": "marketing",
  "/users": "system",
  "/system": "system",
  "/contracts": "system",
};

function flattenMenuKeys(items: NonNullable<MenuProps["items"]>) {
  const keys: string[] = [];
  for (const item of items) {
    if (!item || !("key" in item)) continue;
    if (typeof item.key === "string" && item.key.startsWith("/")) {
      keys.push(item.key);
    }
    if ("children" in item && Array.isArray(item.children)) {
      keys.push(...flattenMenuKeys(item.children));
    }
  }
  return keys;
}

const routeKeys = flattenMenuKeys(menuItems ?? []);

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKeys = useMemo(() => {
    const matched = routeKeys
      .filter((key) => location.pathname === key || location.pathname.startsWith(key + "/"))
      .sort((a, b) => b.length - a.length)[0];
    return [matched ?? "/dashboard"];
  }, [location.pathname]);

  const openKeys = useMemo(() => {
    const selected = selectedKeys[0];
    const parent = Object.entries(routeParentKey)
      .filter(([route]) => selected === route || selected.startsWith(route + "/"))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1];
    return parent ? [parent] : [];
  }, [selectedKeys]);

  return (
    <Layout className="admin-shell">
      <Sider width={236} collapsed={collapsed} className="admin-sider">
        <div className="brand">
          <div className="brand-mark">DL</div>
          {!collapsed && (
            <div>
              <div className="brand-title">数字生活平台</div>
              <div className="brand-subtitle">Mock Admin</div>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={(item) => navigate(item.key)}
        />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
          />
          <Typography.Text type="secondary">Mock 模式：本地数据，不请求真实后端</Typography.Text>
          <Space className="header-user">
            <Avatar icon={<UserOutlined />} />
            <span>演示管理员</span>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                localStorage.removeItem("admin-token");
                navigate("/login");
              }}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
