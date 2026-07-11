import { Button, Card, Descriptions, Drawer, Input, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DOMAIN_CATALOG,
  FINANCE_SPECIALIZED_CAPABILITIES,
  getDomainBySlug,
  getDomainForRequirement,
  type DomainCatalogEntry,
  type DomainMaturity,
} from "../registry/domainCatalog";
import type { PcRequirement } from "../registry/pcRequirementRegistry";
import { requirementLedgerService } from "../services/requirementLedgerService";

const maturityMeta: Record<DomainMaturity, { label: string; color: string }> = {
  SPECIALIZED: { label: "专用能力已映射", color: "green" },
  SHARED: { label: "共享能力", color: "blue" },
  BLOCKED: { label: "未确认阻断", color: "orange" },
};

function MaturityTag({ domain }: { domain: DomainCatalogEntry }) {
  const meta = maturityMeta[domain.maturity];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

export function RequirementLedgerPage() {
  const { domainSlug, requirementId } = useParams();
  const navigate = useNavigate();
  const routeDomain = domainSlug ? getDomainBySlug(domainSlug) : undefined;
  const [keyword, setKeyword] = useState("");
  const [group, setGroup] = useState<string | undefined>(routeDomain?.name);
  const [unconfirmed, setUnconfirmed] = useState<boolean | undefined>();
  const [rows, setRows] = useState<PcRequirement[]>([]);
  const [selected, setSelected] = useState<PcRequirement>();

  useEffect(() => {
    if (domainSlug && !routeDomain) navigate("/operations", { replace: true });
    setGroup(routeDomain?.name);
  }, [domainSlug, navigate, routeDomain]);
  useEffect(() => {
    void requirementLedgerService.query({ keyword, group, unconfirmed }).then((result) => setRows(result.items));
  }, [keyword, group, unconfirmed]);
  useEffect(() => {
    if (requirementId) void requirementLedgerService.get(requirementId.toUpperCase()).then(setSelected).catch(() => navigate("/operations"));
  }, [navigate, requirementId]);

  const columns = useMemo<ColumnsType<PcRequirement>>(() => [
    { title: "需求", dataIndex: "id", width: 100, fixed: "left" },
    { title: "业务域", dataIndex: "group", width: 130 },
    { title: "Owner", width: 190, render: (_, record) => getDomainForRequirement(record.id)?.owner ?? "未绑定" },
    { title: "成熟度", width: 150, render: (_, record) => { const domain = getDomainForRequirement(record.id); return domain ? <MaturityTag domain={domain} /> : <Tag color="red">未绑定</Tag>; } },
    { title: "模块", dataIndex: "module", width: 180 },
    { title: "确认状态", dataIndex: "unconfirmed", width: 130, render: (value: boolean) => value ? <Tag color="warning">UNCONFIRMED</Tag> : <Tag color="success">已确认范围</Tag> },
    { title: "需求说明", dataIndex: "detail", ellipsis: true },
    { title: "操作", width: 100, fixed: "right", render: (_, record) => <Space>
      <Button size="small" onClick={() => { setSelected(record); navigate(record.route); }}>详情</Button>
    </Space> },
  ], [navigate]);

  const specialized = routeDomain?.financeSafety.specializedCapabilities
    .map((key) => FINANCE_SPECIALIZED_CAPABILITIES[key as keyof typeof FINANCE_SPECIALIZED_CAPABILITIES])
    .filter(Boolean) ?? [];

  return <Space direction="vertical" size={16} style={{ width: "100%" }}>
    <div><Typography.Title level={2} style={{ marginBottom: 4 }}>{routeDomain ? routeDomain.name : "PC 运营功能台账"}</Typography.Title><Typography.Text type="secondary">PC-080..PC-172 · 93 条 · 17 个命名业务域 · 24 条 UNCONFIRMED</Typography.Text></div>
    {routeDomain && <Card title="领域实施证据">
      <Descriptions bordered size="small" column={2} items={[
        { key: "owner", label: "Owner", children: routeDomain.owner },
        { key: "maturity", label: "实现成熟度", children: <MaturityTag domain={routeDomain} /> },
        { key: "route", label: "命名路由", children: routeDomain.route },
        { key: "safety", label: "资金安全等级", children: routeDomain.financeSafety.level },
        { key: "page", label: "主能力页面", children: <Button type="link" href={routeDomain.primaryPage.route}>{routeDomain.primaryPage.name}</Button> },
        { key: "service", label: "主 Service", children: routeDomain.primaryService.locator },
        { key: "test", label: "主 Test", children: routeDomain.primaryTest.locator },
        { key: "ids", label: "需求范围", children: `${routeDomain.requirementIds[0]}..${routeDomain.requirementIds[routeDomain.requirementIds.length - 1]}（${routeDomain.requirementIds.length} 条）` },
      ]} />
      {specialized.length > 0 && <Space wrap style={{ marginTop: 16 }}><Typography.Text strong>专用能力入口：</Typography.Text>{specialized.map((item) => <Button key={item.route} href={item.route}>{item.label}</Button>)}</Space>}
    </Card>}
    <Card><Space wrap>
      <Input.Search allowClear placeholder="搜索需求 ID、模块或说明" style={{ width: 320 }} onSearch={setKeyword} onChange={(event) => !event.target.value && setKeyword("")} />
      <Select allowClear placeholder="业务域" value={group} style={{ width: 200 }} options={DOMAIN_CATALOG.map((domain) => ({ value: domain.name, label: domain.name }))} onChange={(value) => { setGroup(value); const domain = DOMAIN_CATALOG.find((item) => item.name === value); if (domain) navigate(domain.route); else navigate("/operations"); }} />
      <Select allowClear placeholder="确认状态" style={{ width: 160 }} options={[{ value: false, label: "已确认范围" }, { value: true, label: "UNCONFIRMED" }]} onChange={setUnconfirmed} />
      <Button onClick={() => navigate("/financial-workbench")}>进入资金专用工作台</Button>
    </Space></Card>
    <Card><Table rowKey="id" columns={columns} dataSource={rows} scroll={{ x: 1450 }} pagination={{ pageSize: 12, showTotal: (total) => `共 ${total} 条` }} /></Card>
    <Drawer width={680} title={selected ? `${selected.id} · ${selected.module}` : "需求详情"} open={Boolean(selected)} onClose={() => { setSelected(undefined); navigate(getDomainForRequirement(selected?.id ?? "")?.route ?? "/operations"); }}>
      {selected && <Descriptions bordered column={1} size="small" items={[
        { key: "group", label: "业务域", children: selected.group },
        { key: "owner", label: "Owner", children: getDomainForRequirement(selected.id)?.owner },
        { key: "maturity", label: "成熟度", children: getDomainForRequirement(selected.id) ? <MaturityTag domain={getDomainForRequirement(selected.id)!} /> : "未绑定" },
        { key: "module", label: "模块", children: selected.module },
        { key: "status", label: "确认状态", children: selected.unconfirmed ? <Tag color="warning">UNCONFIRMED · 真实动作禁用</Tag> : <Tag color="success">已确认范围</Tag> },
        { key: "detail", label: "来源说明", children: selected.detail },
        { key: "page", label: "页面证据", children: getDomainForRequirement(selected.id)?.primaryPage.locator },
        { key: "service", label: "Service 证据", children: getDomainForRequirement(selected.id)?.primaryService.locator },
        { key: "test", label: "Test 证据", children: getDomainForRequirement(selected.id)?.primaryTest.locator },
        { key: "source", label: "来源哈希", children: <Typography.Text code copyable>{selected.sourceSha256}</Typography.Text> },
      ]} />}
    </Drawer>
  </Space>;
}
