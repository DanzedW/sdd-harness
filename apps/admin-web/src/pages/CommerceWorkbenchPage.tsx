import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import {
  COMMERCE_ACTION_LABELS,
  COMMERCE_STAGE_LABELS,
  type CommerceAction,
  type CommerceCase,
} from "../domain/commerceWorkflow";
import {
  commerceWorkflowService,
  getAvailableActions,
  getNextAction,
} from "../services/commerceWorkflowService";
import {
  buildCommerceSummary,
  buildCommerceTimeline,
  formatCommerceMoney,
  getPrimaryActionText,
} from "./commerceWorkbenchModel";

const moduleLinks = [
  ["商户", "/merchants"],
  ["商品", "/products"],
  ["订单", "/orders"],
  ["退款", "/refund"],
  ["结算", "/settlement"],
] as const;

function operationKey(caseId: string, action: CommerceAction) {
  return `${caseId}:${action}:${Date.now()}`;
}

export function CommerceWorkbenchPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState(() => commerceWorkflowService.list());
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const selected = cases.find((item) => item.id === selectedId);
  const summary = useMemo(() => buildCommerceSummary(cases), [cases]);
  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return query
      ? cases.filter((item) => [item.id, item.orderNo, item.merchantName, item.productName].some((value) => value.toLowerCase().includes(query)))
      : cases;
  }, [cases, keyword]);

  function reload(id?: string) {
    const next = commerceWorkflowService.list();
    setCases(next);
    if (id) setSelectedId(id);
  }

  function execute(caseItem: CommerceCase, action: CommerceAction, note = "") {
    try {
      commerceWorkflowService.act(caseItem.id, action, "当前运营员", operationKey(caseItem.id, action), note);
      reload(caseItem.id);
      message.success(`${COMMERCE_ACTION_LABELS[action]}成功`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作失败");
    }
  }

  function confirmAction(caseItem: CommerceCase, action: CommerceAction) {
    const isException = action === "REQUEST_REFUND" || action === "FLAG_RECONCILIATION";
    Modal.confirm({
      title: COMMERCE_ACTION_LABELS[action],
      content: isException ? "该操作会进入异常处理分支，并记录完整审计。" : `确认将案例推进到下一业务阶段？`,
      okText: "确认执行",
      cancelText: "取消",
      onOk: () => execute(caseItem, action, isException ? COMMERCE_ACTION_LABELS[action] : ""),
    });
  }

  const columns: ColumnsType<CommerceCase> = [
    { title: "案例编号", dataIndex: "id", width: 110 },
    { title: "商户", dataIndex: "merchantName", ellipsis: true },
    { title: "商品/服务", dataIndex: "productName", ellipsis: true },
    { title: "订单号", dataIndex: "orderNo", width: 170 },
    { title: "金额", dataIndex: "orderAmount", width: 110, render: formatCommerceMoney },
    {
      title: "当前阶段",
      dataIndex: "stage",
      width: 130,
      render: (stage: CommerceCase["stage"]) => <Tag color={stage === "COMPLETED" ? "success" : stage === "REFUNDED" ? "default" : stage === "RECONCILIATION" ? "error" : "processing"}>{COMMERCE_STAGE_LABELS[stage]}</Tag>,
    },
    { title: "风险", dataIndex: "riskMessage", render: (value: string) => value ? <Typography.Text type="danger">{value}</Typography.Text> : "-" },
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_, item) => {
        const primary = getNextAction(item);
        return (
          <Space>
            <Button type="link" onClick={() => setSelectedId(item.id)}>详情</Button>
            {primary && <Button size="small" type="primary" onClick={() => confirmAction(item, primary)}>{COMMERCE_ACTION_LABELS[primary]}</Button>}
          </Space>
        );
      },
    },
  ];

  return (
    <BackofficePage
      breadcrumbs={["业务运营", "电商运营工作台"]}
      title="电商运营工作台"
      description="贯通商户准入、商品上架、支付、履约、结算、退款和对账的可操作 Mock 业务闭环。"
      actions={
        <Space>
          <Button onClick={() => Modal.confirm({ title: "恢复演示数据", content: "将清除本工作台的操作记录并恢复初始案例。", onOk: () => { commerceWorkflowService.reset(); reload(); message.success("演示数据已恢复"); } })}>恢复演示数据</Button>
          <Button type="primary" onClick={() => setSelectedId(cases[0]?.id)}>开始处理</Button>
        </Space>
      }
    >
      <Alert showIcon type="info" message="本地可操作 Mock" description="状态和审计保存在浏览器 localStorage；不会调用真实支付、退款或清结算渠道。" />
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} lg={6}><Card><Statistic title="业务案例" value={summary.total} suffix="个" /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="待处理" value={summary.pending} suffix="个" valueStyle={{ color: "#1677ff" }} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="风险案例" value={summary.risk} suffix="个" valueStyle={{ color: summary.risk ? "#cf1322" : undefined }} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="已完成" value={summary.completed} suffix="个" valueStyle={{ color: "#389e0d" }} /></Card></Col>
      </Row>
      <Card style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索案例、订单、商户或商品" allowClear style={{ width: 320 }} />
          {moduleLinks.map(([label, route]) => <Button key={route} onClick={() => navigate(route)}>进入{label}管理</Button>)}
        </Space>
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={false} scroll={{ x: 1100 }} />
      </Card>

      <Drawer title="业务案例详情" width={760} open={Boolean(selected)} onClose={() => setSelectedId(undefined)}>
        {selected && (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Descriptions bordered column={2} size="small" items={[
              { key: "id", label: "案例", children: selected.id },
              { key: "order", label: "订单", children: selected.orderNo },
              { key: "merchant", label: "商户", children: selected.merchantName },
              { key: "product", label: "商品/服务", children: selected.productName },
              { key: "amount", label: "订单金额", children: formatCommerceMoney(selected.orderAmount) },
              { key: "stage", label: "当前阶段", children: <Tag color="processing">{COMMERCE_STAGE_LABELS[selected.stage]}</Tag> },
            ]} />
            <Steps responsive current={0} items={buildCommerceTimeline(selected)} />
            {selected.riskMessage && <Alert showIcon type="error" message="当前风险" description={selected.riskMessage} />}
            <Card size="small" title="下一步">
              <Space wrap>
                <Button type="primary" disabled={!getNextAction(selected)} onClick={() => { const action = getNextAction(selected); if (action) confirmAction(selected, action); }}>{getPrimaryActionText(selected)}</Button>
                {getAvailableActions(selected).includes("REQUEST_REFUND") && <Button danger onClick={() => confirmAction(selected, "REQUEST_REFUND")}>申请退款</Button>}
                {getAvailableActions(selected).includes("FLAG_RECONCILIATION") && <Button danger onClick={() => confirmAction(selected, "FLAG_RECONCILIATION")}>标记对账差异</Button>}
              </Space>
            </Card>
            <Typography.Title level={5}>审计记录</Typography.Title>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={[...selected.audits].reverse()}
              locale={{ emptyText: "尚未执行操作" }}
              columns={[
                { title: "时间", dataIndex: "createdAt", width: 170 },
                { title: "操作人", dataIndex: "operator", width: 100 },
                { title: "动作", dataIndex: "action", render: (action: CommerceAction) => COMMERCE_ACTION_LABELS[action] },
                { title: "状态变化", render: (_, audit) => `${COMMERCE_STAGE_LABELS[audit.fromStage]} → ${COMMERCE_STAGE_LABELS[audit.toStage]}` },
                { title: "说明", dataIndex: "note", render: (value: string) => value || "-" },
              ]}
            />
          </Space>
        )}
      </Drawer>
    </BackofficePage>
  );
}
