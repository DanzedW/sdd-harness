import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tabs,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../services/adminService";
import type { AdminAccount, Role, SystemMenu } from "../types";

// ────────────── StatusTag 复用 ──────────────
const statusColors: Record<string, string> = {
  启用: "green",
  停用: "default",
  草稿: "blue",
  待审核: "orange",
  已完成: "green",
  处理中: "processing",
  异常: "red",
  上架: "green",
  下架: "red",
};

function StatusTag({ status }: { status: string }) {
  return <Tag color={statusColors[status] ?? "default"}>{status}</Tag>;
}

// ────────────── 权限 Tag 颜色映射 ──────────────
const permColors: Record<string, string> = {
  "全部权限": "red",
  "商品管理": "blue",
  "订单管理": "geekblue",
  "商户管理": "purple",
  "用户管理": "cyan",
  "分类管理": "gold",
  "广告管理": "magenta",
  "系统管理": "volcano",
  "结算管理": "lime",
  "数据报表": "green",
  "日志审计": "orange",
  "售后管理": "pink",
};

function getPermTagColor(perm: string): string {
  return permColors[perm] ?? "default";
}

// ────────────── 静态列定义（提到函数外部，精简组件代码）──────────────
const ROLE_STATIC_COLUMNS: ColumnsType<Role> = [
  { title: "角色名称", dataIndex: "name", width: 140 },
  {
    title: "权限标签",
    dataIndex: "permissions",
    width: 360,
    render: (value: string[]) => (
      <Space wrap size={[4, 4]}>
        {value.map((p) => (
          <Tag key={p} color={getPermTagColor(p)}>
            {p}
          </Tag>
        ))}
      </Space>
    ),
  },
  { title: "用户数", dataIndex: "userCount", width: 90 },
  { title: "状态", dataIndex: "status", width: 90, render: (v: string) => <StatusTag status={v} /> },
];

const ACCOUNT_STATIC_COLUMNS: ColumnsType<AdminAccount> = [
  { title: "姓名", dataIndex: "name", width: 110 },
  { title: "账号", dataIndex: "account", width: 150 },
  {
    title: "角色",
    dataIndex: "role",
    width: 160,
    render: (value: string) => <Tag color={getPermTagColor(value) || "default"}>{value}</Tag>,
  },
  { title: "手机号", dataIndex: "phone", width: 140 },
  { title: "状态", dataIndex: "status", width: 90, render: (v: string) => <StatusTag status={v} /> },
];

const MENU_STATIC_COLUMNS: ColumnsType<SystemMenu> = [
  { title: "菜单名称", dataIndex: "name", width: 140 },
  { title: "路径", dataIndex: "path", width: 180 },
  { title: "权限标识", dataIndex: "permission", width: 180 },
  { title: "排序", dataIndex: "sort", width: 80 },
  { title: "状态", dataIndex: "status", width: 90, render: (v: string) => <StatusTag status={v} /> },
];

// ═══════════════════════════════════════════
// 角色管理子页面
// ═══════════════════════════════════════════
function RoleListPage() {
  const [records, setRecords] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminService.roles({ keyword, status, page, pageSize });
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [keyword, page, pageSize, status]);

  useEffect(() => { void loadData(); }, [loadData]);

  const columns: ColumnsType<Role> = useMemo(
    () => [
      ...ROLE_STATIC_COLUMNS,
      {
        title: "操作",
        width: 180,
        fixed: "right",
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue(record);
                setModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除？"
              onConfirm={async () => {
                await adminService.removeRole(record.id);
                message.success("已删除");
                await loadData();
              }}
            >
              <Button type="link" danger>删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [form, loadData],
  );

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索角色名称"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => setPage(1)}
          style={{ width: 240 }}
        />
        <Select
          allowClear
          placeholder="状态"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={["启用", "停用", "草稿"].map((item) => ({ label: item, value: item }))}
          style={{ width: 120 }}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => { setKeyword(""); setStatus(undefined); setPage(1); }}
        >
          重置
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}
        >
          新增角色
        </Button>
      </div>

      <Table<Role>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={records}
        scroll={{ x: 900 }}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true,
          showTotal: (v) => "共 " + v + " 条",
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal
        title={editing ? "编辑角色" : "新增角色"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          if (editing) {
            await adminService.saveRole({ ...editing, ...values });
          } else {
            await adminService.saveRole({
              id: "MOCK-" + Date.now(), status: "启用", updatedAt: "刚刚", ...values,
            } as Role);
          }
          message.success("已写入本地 Mock 数据");
          setModalOpen(false);
          await loadData();
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="角色名称" name="name" rules={[{ required: true, message: "请输入角色名称" }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item label="权限" name="permissions">
            <Select
              mode="multiple"
              placeholder="请选择权限"
              options={[
                "全部权限", "商品管理", "订单管理", "商户管理", "用户管理",
                "分类管理", "广告管理", "系统管理", "结算管理", "数据报表",
                "日志审计", "售后管理",
              ].map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>
          <Form.Item label="用户数" name="userCount">
            <Input type="number" placeholder="请输入用户数" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════
// 管理员账号子页面
// ═══════════════════════════════════════════
function AccountListPage() {
  const [records, setRecords] = useState<AdminAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminService.adminAccounts({ keyword, status, page, pageSize });
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [keyword, page, pageSize, status]);

  useEffect(() => { void loadData(); }, [loadData]);

  const columns: ColumnsType<AdminAccount> = useMemo(
    () => [
      ...ACCOUNT_STATIC_COLUMNS,
      {
        title: "操作",
        width: 180,
        fixed: "right",
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue(record);
                setModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除？"
              onConfirm={async () => {
                await adminService.removeAdminAccount(record.id);
                message.success("已删除");
                await loadData();
              }}
            >
              <Button type="link" danger>删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [form, loadData],
  );

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索姓名、账号、角色"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => setPage(1)}
          style={{ width: 240 }}
        />
        <Select
          allowClear
          placeholder="状态"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={["启用", "停用", "草稿"].map((item) => ({ label: item, value: item }))}
          style={{ width: 120 }}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => { setKeyword(""); setStatus(undefined); setPage(1); }}
        >
          重置
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}
        >
          新增账号
        </Button>
      </div>

      <Table<AdminAccount>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={records}
        scroll={{ x: 900 }}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true,
          showTotal: (v) => "共 " + v + " 条",
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal
        title={editing ? "编辑账号" : "新增账号"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          if (editing) {
            await adminService.saveAdminAccount({ ...editing, ...values });
          } else {
            await adminService.saveAdminAccount({
              id: "MOCK-" + Date.now(), status: "启用", updatedAt: "刚刚", ...values,
            } as AdminAccount);
          }
          message.success("已写入本地 Mock 数据");
          setModalOpen(false);
          await loadData();
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: "请输入姓名" }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item label="账号" name="account" rules={[{ required: true, message: "请输入账号" }]}>
            <Input placeholder="请输入登录账号" />
          </Form.Item>
          <Form.Item label="密码" name="password">
            <Input.Password placeholder="请输入密码（Mock 模式固定值）" />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true, message: "请选择角色" }]}>
            <Select
              placeholder="请选择角色"
              options={["平台管理员", "运营人员", "财务人员", "客服人员", "商户管理员", "数据运营", "内容编辑", "系统审计员"].map(
                (item) => ({ label: item, value: item }),
              )}
            />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════
// 系统菜单子页面
// ═══════════════════════════════════════════
function MenuListPage() {
  const [records, setRecords] = useState<SystemMenu[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemMenu | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminService.systemMenus({ keyword, status, page, pageSize });
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [keyword, page, pageSize, status]);

  useEffect(() => { void loadData(); }, [loadData]);

  const columns: ColumnsType<SystemMenu> = useMemo(
    () => [
      ...MENU_STATIC_COLUMNS,
      {
        title: "操作",
        width: 180,
        fixed: "right",
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue(record);
                setModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除？"
              onConfirm={async () => {
                await adminService.removeSystemMenu(record.id);
                message.success("已删除");
                await loadData();
              }}
            >
              <Button type="link" danger>删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [form, loadData],
  );

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索菜单、路径、权限"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => setPage(1)}
          style={{ width: 240 }}
        />
        <Select
          allowClear
          placeholder="状态"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={["启用", "停用", "草稿"].map((item) => ({ label: item, value: item }))}
          style={{ width: 120 }}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => { setKeyword(""); setStatus(undefined); setPage(1); }}
        >
          重置
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}
        >
          新增菜单
        </Button>
      </div>

      <Table<SystemMenu>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={records}
        scroll={{ x: 900 }}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true,
          showTotal: (v) => "共 " + v + " 条",
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal
        title={editing ? "编辑菜单" : "新增菜单"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          if (editing) {
            await adminService.saveSystemMenu({ ...editing, ...values });
          } else {
            await adminService.saveSystemMenu({
              id: "MOCK-" + Date.now(), status: "启用", updatedAt: "刚刚", ...values,
            } as SystemMenu);
          }
          message.success("已写入本地 Mock 数据");
          setModalOpen(false);
          await loadData();
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="菜单名称" name="name" rules={[{ required: true, message: "请输入菜单名称" }]}>
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item label="路径" name="path" rules={[{ required: true, message: "请输入路径" }]}>
            <Input placeholder="例如 /dashboard" />
          </Form.Item>
          <Form.Item label="权限标识" name="permission" rules={[{ required: true, message: "请输入权限标识" }]}>
            <Input placeholder="例如 dashboard:view" />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <Input type="number" placeholder="数字越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════
export function SystemPage() {
  return (
    <section className="system-page">
      <Typography.Title level={3}>系统管理</Typography.Title>
      <Typography.Paragraph type="secondary">菜单配置、角色权限和人员账号的前端 Mock 管理。</Typography.Paragraph>
      <Row gutter={[16, 16]} className="system-summary" style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card size="small" title="菜单配置">维护后台导航菜单、路由路径和权限标识，共 10 条 Mock 数据。</Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" title="角色管理">管理角色名称、权限标签和用户数量，共 8 条 Mock 数据。</Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" title="账号管理">管理后台人员账号、角色关联和联系方式，共 8 条 Mock 数据。</Card>
        </Col>
      </Row>
      <Tabs
        items={[
          {
            key: "menus",
            label: "菜单配置",
            children: <MenuListPage />,
          },
          {
            key: "roles",
            label: "角色管理",
            children: <RoleListPage />,
          },
          {
            key: "accounts",
            label: "账号管理",
            children: <AccountListPage />,
          },
        ]}
      />
    </section>
  );
}
