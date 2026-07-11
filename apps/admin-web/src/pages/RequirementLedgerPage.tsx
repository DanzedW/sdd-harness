import { Button, Card, Descriptions, Drawer, Input, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PC_REQUIREMENT_GROUPS, type PcRequirement } from "../registry/pcRequirementRegistry";
import { requirementLedgerService } from "../services/requirementLedgerService";

export function RequirementLedgerPage() {
  const { domainIndex, requirementId } = useParams();
  const navigate = useNavigate();
  const routeGroup = domainIndex === undefined ? undefined : PC_REQUIREMENT_GROUPS[Number(domainIndex)];
  const [keyword, setKeyword] = useState("");
  const [group, setGroup] = useState<string | undefined>(routeGroup);
  const [unconfirmed, setUnconfirmed] = useState<boolean | undefined>();
  const [rows, setRows] = useState<PcRequirement[]>([]);
  const [selected, setSelected] = useState<PcRequirement>();

  useEffect(() => setGroup(routeGroup), [routeGroup]);
  useEffect(() => {
    void requirementLedgerService.query({ keyword, group, unconfirmed }).then((result) => setRows(result.items));
  }, [keyword, group, unconfirmed]);
  useEffect(() => {
    if (requirementId) void requirementLedgerService.get(requirementId.toUpperCase()).then(setSelected).catch(() => navigate("/operations"));
  }, [navigate, requirementId]);

  const columns = useMemo<ColumnsType<PcRequirement>>(() => [
    { title: "需求", dataIndex: "id", width: 100, fixed: "left" },
    { title: "业务域", dataIndex: "group", width: 130 },
    { title: "模块", dataIndex: "module", width: 180 },
    { title: "页面", dataIndex: "page", width: 110, render: (value) => value === "financial" ? <Tag color="gold">资金工作台</Tag> : <Tag color="blue">功能台账</Tag> },
    { title: "确认状态", dataIndex: "unconfirmed", width: 130, render: (value: boolean) => value ? <Tag color="warning">UNCONFIRMED</Tag> : <Tag color="success">已确认范围</Tag> },
    { title: "需求说明", dataIndex: "detail", ellipsis: true },
    { title: "操作", width: 180, fixed: "right", render: (_, record) => <Space>
      <Button size="small" onClick={() => { setSelected(record); navigate(record.route); }}>详情</Button>
      <Button size="small" type="primary" disabled={record.unconfirmed} title={record.unconfirmed ? "UNCONFIRMED 真实动作已禁用" : undefined} onClick={() => void requirementLedgerService.execute(record.id, `ui-${record.id}-${Date.now()}`).then(() => message.success("Mock 动作完成并已审计"))}>执行</Button>
    </Space> },
  ], [navigate]);

  return <Space direction="vertical" size={16} style={{ width: "100%" }}>
    <div><Typography.Title level={2} style={{ marginBottom: 4 }}>PC 运营功能台账</Typography.Title><Typography.Text type="secondary">PC-080..PC-172 · 93 条 · 17 个业务域 · 24 条 UNCONFIRMED</Typography.Text></div>
    <Card><Space wrap>
      <Input.Search allowClear placeholder="搜索需求 ID、模块或说明" style={{ width: 320 }} onSearch={setKeyword} onChange={(event) => !event.target.value && setKeyword("")} />
      <Select allowClear placeholder="业务域" value={group} style={{ width: 180 }} options={PC_REQUIREMENT_GROUPS.map((value) => ({ value, label: value }))} onChange={setGroup} />
      <Select allowClear placeholder="确认状态" style={{ width: 160 }} options={[{ value: false, label: "已确认范围" }, { value: true, label: "UNCONFIRMED" }]} onChange={setUnconfirmed} />
      <Button onClick={() => navigate("/financial-workbench")}>进入资金专用工作台</Button>
    </Space></Card>
    <Card><Table rowKey="id" columns={columns} dataSource={rows} scroll={{ x: 1200 }} pagination={{ pageSize: 12, showTotal: (total) => `共 ${total} 条` }} /></Card>
    <Drawer width={640} title={selected ? `${selected.id} · ${selected.module}` : "需求详情"} open={Boolean(selected)} onClose={() => { setSelected(undefined); navigate(group ? `/operations/domain/${PC_REQUIREMENT_GROUPS.indexOf(group)}` : "/operations"); }}>
      {selected && <Descriptions bordered column={1} size="small" items={[
        { key: "group", label: "业务域", children: selected.group },
        { key: "module", label: "模块", children: selected.module },
        { key: "status", label: "确认状态", children: selected.unconfirmed ? <Tag color="warning">UNCONFIRMED · 真实动作禁用</Tag> : <Tag color="success">已确认范围</Tag> },
        { key: "detail", label: "来源说明", children: selected.detail },
        { key: "source", label: "来源哈希", children: <Typography.Text code copyable>{selected.sourceSha256}</Typography.Text> },
        { key: "route", label: "路由", children: selected.route },
      ]} />}
    </Drawer>
  </Space>;
}
