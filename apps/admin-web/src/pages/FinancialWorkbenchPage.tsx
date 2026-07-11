import { Alert, Card, Descriptions, Space, Statistic, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { type PcRequirement } from "../registry/pcRequirementRegistry";
import { requirementLedgerService } from "../services/requirementLedgerService";

export function FinancialWorkbenchPage() {
  const [rows, setRows] = useState<PcRequirement[]>([]);
  useEffect(() => { void requirementLedgerService.query().then(({ items }) => setRows(items.filter((item) => item.page === "financial"))); }, []);
  return <Space direction="vertical" size={16} style={{ width: "100%" }}>
    <div><Typography.Title level={2} style={{ marginBottom: 4 }}>资金链路专用工作台</Typography.Title><Typography.Text type="secondary">支付、退款、分账、结算、对账统一呈现；金额单位为整数分，比例单位为整数基点。</Typography.Text></div>
    <Alert showIcon type="info" message="Mock 安全模式" description="所有写操作需要幂等键并生成审计记录；UNCONFIRMED 合同、接口与资金口径不得执行。" />
    <Space wrap>
      <Card><Statistic title="资金相关需求" value={rows.length} suffix="条" /></Card>
      <Card><Statistic title="UNCONFIRMED" value={rows.filter((item) => item.unconfirmed).length} suffix="条" /></Card>
      <Card><Statistic title="内部金额单位" value="cent" /></Card>
      <Card><Statistic title="内部比例单位" value="bp" /></Card>
    </Space>
    <Card title="治理语义"><Descriptions bordered size="small" items={[
      { key: "idempotency", label: "幂等", children: "idempotencyKey 唯一，重复请求复用原审计结果" },
      { key: "state", label: "状态", children: "支付/退款/分账/结算/对账状态显式留存" },
      { key: "audit", label: "审计", children: "操作人、时间、输入、结果、异常原因可追溯" },
      { key: "reconcile", label: "对账", children: "来源金额、分配金额、差异与处理状态并列核验" },
    ]} /></Card>
    <Card title="资金需求清单"><Table rowKey="id" dataSource={rows} pagination={{ pageSize: 10 }} columns={[
      { title: "ID", dataIndex: "id", width: 100 }, { title: "业务域", dataIndex: "group", width: 140 }, { title: "模块", dataIndex: "module", width: 180 },
      { title: "确认状态", dataIndex: "unconfirmed", width: 140, render: (value: boolean) => value ? <Tag color="warning">UNCONFIRMED</Tag> : <Tag color="success">可 Mock 执行</Tag> },
      { title: "状态/异常/对账语义", render: (_, record) => record.unconfirmed ? "等待接口、合同或资金口径确认" : "幂等执行 → 审计 → 异常留痕 → 对账" },
    ]} /></Card>
  </Space>;
}
