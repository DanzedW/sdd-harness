import { Alert, Button, Card, Descriptions, Drawer, Input, Select, Space, Statistic, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { OperationRequirement } from "../operations/registry";
import { DOMAIN_CATALOG, getDomainByName, getDomainBySlug } from "../operations/domainCatalog";
import { getWorkbenchKind } from "../operations/workbench";
import { centsToYuan } from "../operations/policies";
import { operationsService } from "../services/operationsService";

export function OperationsRegistryPage() {
  const location = useLocation();
  const domainSlug = location.pathname.startsWith("/operations/") ? location.pathname.slice("/operations/".length) : undefined;
  const routedDomain = getDomainBySlug(domainSlug);
  const [group, setGroup] = useState<string | undefined>(routedDomain?.name);
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<OperationRequirement[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<OperationRequirement>();
  const [loading, setLoading] = useState(false);

  useEffect(() => setGroup(routedDomain?.name), [routedDomain?.name]);
  useEffect(() => {
    setLoading(true);
    operationsService.query({ group, keyword, pageSize: 100 }).then((result) => {
      setRows(result.items); setTotal(result.total); setLoading(false);
    });
  }, [group, keyword]);

  const financeCount = useMemo(() => rows.filter((item) => getWorkbenchKind(item) === "finance").length, [rows]);
  const activeDomain = getDomainByName(group);
  const columns: ColumnsType<OperationRequirement> = [
    { title: "需求ID", dataIndex: "id", width: 100, fixed: "left" },
    { title: "业务域", dataIndex: "group", width: 140 },
    { title: "功能模块", dataIndex: "module", width: 170 },
    { title: "Owner", width: 180, render: (_, row) => getDomainByName(row.group)?.owner },
    { title: "来源行", dataIndex: "excelRow", width: 90, render: (value) => `Excel ${value}` },
    { title: "工作台", width: 100, render: (_, row) => <Tag color={getWorkbenchKind(row) === "finance" ? "gold" : "blue"}>{getWorkbenchKind(row) === "finance" ? "资金" : "配置"}</Tag> },
    { title: "口径", width: 130, render: (_, row) => row.unconfirmed ? <Tag color="warning">UNCONFIRMED</Tag> : <Tag color="success">已确认</Tag> },
    { title: "成熟度", width: 160, render: (_, row) => <Tag color={getDomainByName(row.group)?.maturity === "IMPLEMENTED_SPECIALIZED" ? "purple" : "blue"}>{getDomainByName(row.group)?.maturity === "IMPLEMENTED_SPECIALIZED" ? "专用能力" : "共享实现"}</Tag> },
    { title: "操作", width: 100, fixed: "right", render: (_, row) => <Button size="small" onClick={() => setSelected(row)}>详情</Button> },
  ];

  return <div className="operations-page">
    <div className="page-heading"><div><Typography.Title level={3}>PC 运营功能台账</Typography.Title><Typography.Text type="secondary">PC-080..PC-172 · 17 个业务域 · 页面仅通过 services 访问 Mock</Typography.Text></div></div>
    <Alert className="operations-alert" type="info" showIcon message="跨域台账仅提供查询、详情与专用能力导航；不提供任何通用状态修改。" />
    <div className="operations-stats"><Card><Statistic title="当前需求" value={total} suffix="/ 93" /></Card><Card><Statistic title="资金语义工作台" value={financeCount} /></Card><Card><Statistic title="示例审计金额（整数分）" value={centsToYuan(1280050)} /></Card></div>
    <Card className="domain-evidence-card" title={activeDomain ? `${activeDomain.name} · 实现证据` : "17 域实现证据"}>
      {activeDomain ? <Space direction="vertical" size={10}>
        <Space wrap><Tag color="geekblue">Owner：{activeDomain.owner}</Tag><Tag color={activeDomain.maturity === "IMPLEMENTED_SPECIALIZED" ? "purple" : "blue"}>{activeDomain.maturity}</Tag><Tag color={activeDomain.financeSafety.dedicatedRequired ? "red" : "default"}>资金安全：{activeDomain.financeSafety.level}</Tag></Space>
        <Typography.Text type="secondary">页面：{activeDomain.primaryPage}　Service：{activeDomain.primaryService}　Test：{activeDomain.primaryTest}</Typography.Text>
        {activeDomain.specializedCapabilities.length > 0 && <Space wrap>{activeDomain.specializedCapabilities.map((item) => <Button key={`${item.name}-${item.route}`} type="primary"><Link to={item.route}>{item.name}专用入口</Link></Button>)}</Space>}
      </Space> : <Typography.Text type="secondary">选择业务域后查看 owner、成熟度、资金安全和磁盘现有专用页面/service/test；总台账仅承担跨域 trace/query。</Typography.Text>}
    </Card>
    <Card><Space className="operations-filters"><Select allowClear placeholder="全部 17 个业务域" value={group} onChange={setGroup} options={DOMAIN_CATALOG.map((item) => ({ label: `${item.name} (${item.requirementIds.length})`, value: item.name }))} style={{ width: 220 }} /><Input.Search allowClear placeholder="搜索 ID、模块或需求说明" onSearch={setKeyword} onChange={(event) => !event.target.value && setKeyword("")} style={{ width: 360 }} /></Space>
      <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 15, showSizeChanger: false }} scroll={{ x: 1000 }} />
    </Card>
    <Drawer width={680} open={Boolean(selected)} onClose={() => setSelected(undefined)} title={selected ? `${selected.id} · ${selected.module}` : "需求详情"}>
      {selected && <><Descriptions column={1} bordered size="small" items={[{ key: "domain", label: "业务域", children: selected.group }, { key: "source", label: "来源", children: `V1.4 Excel 第 ${selected.excelRow} 行` }, { key: "status", label: "口径状态", children: selected.unconfirmed ? <Tag color="warning">UNCONFIRMED</Tag> : <Tag color="success">已确认</Tag> }, { key: "hash", label: "来源哈希", children: <Typography.Text copyable>{selected.sourceSha256}</Typography.Text> }]} /><Typography.Title level={5} style={{ marginTop: 24 }}>验收口径</Typography.Title><Typography.Paragraph>{selected.detail}</Typography.Paragraph>{selected.unconfirmed && <Alert type="error" showIcon message="依赖第三方、设备、核验或资金口径尚未确认" description="本演示只保留查询与审计入口，不模拟合同结论，不允许状态变更。" />}</>}
    </Drawer>
  </div>;
}
