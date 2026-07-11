import { Alert, Button, Popconfirm, Space, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { FundingPool } from "../domain";
import { v03MockServices } from "../services/v03MockServices";
import { financialStatusColor, formatCents } from "./v03Ui";

export function FundingPoolPage() {
  const [records, setRecords] = useState<FundingPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pools = await v03MockServices.fundingPoolLedgerService.listPools();
      setRecords(pools.filter((item) => item.type === "POINT"));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const recharge = async (record: FundingPool) => {
    try {
      await v03MockServices.fundingPoolLedgerService.recharge({
        poolId: record.id,
        amount: 10_000,
        businessReference: `ui-recharge-${record.id}`,
        idempotentKey: `ui-recharge:${record.id}`,
        operatorId: "demo-operator",
      });
      message.success("已模拟充值 ¥100.00，并写入资金流水与审计");
      await load();
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const columns: ColumnsType<FundingPool> = [
    { title: "资金池", dataIndex: "poolCode", width: 140 },
    { title: "责任方", dataIndex: "ownerName", width: 150 },
    { title: "保管主体", dataIndex: "custodianType", width: 120, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "现金余额", dataIndex: "cashBalance", width: 110, render: formatCents },
    { title: "已发未用责任", dataIndex: "issuedLiability", width: 120, render: formatCents },
    { title: "已用待结算", dataIndex: "occupiedAmount", width: 115, render: formatCents },
    { title: "累计已结算", dataIndex: "settledAmount", width: 115, render: formatCents },
    { title: "预警阈值", dataIndex: "warningThreshold", width: 105, render: formatCents },
    {
      title: "超发策略",
      dataIndex: "allowOverIssue",
      width: 110,
      render: (value: FundingPool["allowOverIssue"]) => value === "UNCONFIRMED" ? <Tag color="orange">待确认</Tag> : <Tag color={value ? "red" : "green"}>{value ? "允许（风险）" : "禁止"}</Tag>,
    },
    { title: "状态", dataIndex: "status", width: 100, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "对账", dataIndex: "reconciliationStatus", width: 105, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    {
      title: "操作",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Popconfirm title="模拟充值 ¥100.00？" onConfirm={() => recharge(record)}>
          <Button type="link" size="small">充值</Button>
        </Popconfirm>
      ),
    },
  ];

  const hasRisk = records.some((item) => item.status === "WARNING" || item.allowOverIssue === true);

  return (
    <BackofficePage breadcrumbs={["统一结算 V0.3", "积分资金池"]} title="积分资金池" description="独立记录现金余额、已发放责任、用户使用占用、结算、调整和余额预警。">
      {error ? <Alert type="error" showIcon message="资金池加载失败" description={error} /> : null}
      {hasRisk ? <Alert type="warning" showIcon message="存在低余额或允许超发的资金池" description="允许超发只作为显式 Mock 风险状态，不代表正式商务规则。" /> : null}
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <LedgerTable rowKey="id" columns={columns} dataSource={records} loading={loading} pagination={false} scroll={{ x: 1400 }} />
      </Space>
    </BackofficePage>
  );
}
