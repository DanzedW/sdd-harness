import { Alert, Button, Descriptions, Form, Input, Popconfirm, Space, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { DetailModal } from "../components/backoffice/DetailModal";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { SplitInstruction } from "../domain";
import { v03MockServices } from "../services/v03MockServices";
import { canRetrySplit, canReverseSplit, financialStatusColor, formatCents } from "./v03Ui";

export function SplitInstructionPage() {
  const [records, setRecords] = useState<SplitInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<SplitInstruction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRecords(await v03MockServices.splitLedgerService.list());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const filtered = useMemo(
    () => records.filter((item) => `${item.splitInstructionNo} ${item.orderId} ${item.merchantId}`.toLowerCase().includes(keyword.trim().toLowerCase())),
    [keyword, records],
  );

  const retry = async (record: SplitInstruction) => {
    try {
      await v03MockServices.splitLedgerService.retry({
        splitId: record.id,
        idempotentKey: `ui-retry:${record.id}:${record.attemptCount + 1}`,
        operatorId: "demo-operator",
        outcome: "SUCCESS",
      });
      message.success("Mock 重试成功，已写入审计记录");
      await load();
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const reverse = async (record: SplitInstruction) => {
    try {
      await v03MockServices.splitLedgerService.reverse({
        splitId: record.id,
        idempotentKey: `ui-reverse:${record.id}`,
        operatorId: "demo-operator",
        reason: "运营后台 Mock 人工冲正",
      });
      message.success("Mock 冲正完成，已生成审计与对账记录");
      await load();
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const columns: ColumnsType<SplitInstruction> = [
    { title: "分账指令", dataIndex: "splitInstructionNo", width: 150 },
    { title: "订单", dataIndex: "orderId", width: 135 },
    { title: "场景", dataIndex: "transactionScene", width: 75, render: (value: string) => value === "ONLINE" ? "线上" : "线下" },
    { title: "商户", dataIndex: "merchantId", width: 85 },
    { title: "分配基数", dataIndex: "allocationBase", width: 100, render: formatCents },
    { title: "商户应收", dataIndex: "merchantAmount", width: 100, render: formatCents },
    { title: "平台收益", dataIndex: "platformAmount", width: 95, render: formatCents },
    { title: "渠道费", dataIndex: "channelFeeAmount", width: 90, render: formatCents },
    { title: "返积分等值", dataIndex: "rewardPointCashEquivalent", width: 105, render: formatCents },
    {
      title: "守恒",
      width: 75,
      render: (_, record) => {
        const sum = record.merchantAmount + record.platformAmount + record.channelFeeAmount + record.rewardPointCashEquivalent + record.roundingAmount;
        return <Tag color={sum === record.allocationBase ? "green" : "red"}>{sum === record.allocationBase ? "通过" : "异常"}</Tag>;
      },
    },
    { title: "状态", dataIndex: "status", width: 95, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "对账", dataIndex: "reconciliationStatus", width: 105, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "次数", dataIndex: "attemptCount", width: 65 },
    {
      title: "操作",
      fixed: "right",
      width: 210,
      render: (_, record) => (
        <Space size={2}>
          <Button type="link" size="small" onClick={() => setSelected(record)}>详情</Button>
          <Popconfirm title="确认模拟重试？" onConfirm={() => retry(record)} disabled={!canRetrySplit(record.status)}>
            <Button type="link" size="small" disabled={!canRetrySplit(record.status)}>重试</Button>
          </Popconfirm>
          <Popconfirm title="确认冲正？" description="将生成冲正审计和待处理对账差异。" onConfirm={() => reverse(record)} disabled={!canReverseSplit(record.status)}>
            <Button type="link" size="small" danger disabled={!canReverseSplit(record.status)}>冲正</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <BackofficePage breadcrumbs={["统一结算 V0.3", "分账台账"]} title="分账台账" description="展示多方金额守恒、失败/部分成功、重试、冲正、审计和对账状态。">
      {error ? <Alert type="error" showIcon message="分账数据加载失败" description={error} /> : null}
      <InlineFilterBar onReset={() => setKeyword("")}>
        <Form.Item label="指令/订单/商户"><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} allowClear /></Form.Item>
      </InlineFilterBar>
      <LedgerTable rowKey="id" columns={columns} dataSource={filtered} loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1650 }} />
      <DetailModal title="分账指令详情" open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            {selected.lastErrorMessage ? <Alert type="warning" showIcon message={selected.lastErrorCode ?? "异常"} description={selected.lastErrorMessage} /> : null}
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="画像快照">{selected.profileSnapshotId} / V{selected.profileVersion}</Descriptions.Item>
              <Descriptions.Item label="幂等键">{selected.idempotentKey}</Descriptions.Item>
              <Descriptions.Item label="可结算时间">{selected.settlementEligibleAt}</Descriptions.Item>
              <Descriptions.Item label="计划到账日">{selected.scheduledSettlementDate}</Descriptions.Item>
              <Descriptions.Item label="舍入调整">{formatCents(selected.roundingAmount)}</Descriptions.Item>
              <Descriptions.Item label="最近更新">{selected.updatedAt}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </DetailModal>
    </BackofficePage>
  );
}
