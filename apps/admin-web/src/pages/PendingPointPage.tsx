import { Alert, Button, Popconfirm, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { PendingPointAccount } from "../domain";
import { v03MockServices } from "../services/v03MockServices";
import { financialStatusColor, formatCents } from "./v03Ui";

export function PendingPointPage() {
  const [records, setRecords] = useState<PendingPointAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await v03MockServices.pointGrantAdminService.listPending());
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const claim = async (record: PendingPointAccount) => {
    try {
      await v03MockServices.pointGrantAdminService.claimDemo(record.id);
      message.success("已模拟手机号验证并幂等认领，积分流水已入账");
      await load();
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const columns: ColumnsType<PendingPointAccount> = [
    { title: "待认领账户", dataIndex: "id", width: 190 },
    { title: "手机号", dataIndex: "phoneMasked", width: 120 },
    { title: "手机号哈希", dataIndex: "phoneHash", width: 170 },
    { title: "发放明细", dataIndex: "grantDetailId", width: 190 },
    { title: "积分", dataIndex: "pointAmount", width: 90 },
    { title: "现金等值", dataIndex: "cashEquivalent", width: 105, render: formatCents },
    { title: "状态", dataIndex: "status", width: 100, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "认领用户", dataIndex: "claimedUserId", width: 120, render: (value: string | null) => value ?? "-" },
    { title: "认领时间", dataIndex: "claimedAt", width: 160, render: (value: string | null) => value ?? "-" },
    {
      title: "操作",
      fixed: "right",
      width: 110,
      render: (_, record) => (
        <Popconfirm title="模拟本人手机号验证并认领？" description="页面不会读取或展示完整手机号。" onConfirm={() => claim(record)} disabled={record.status !== "PENDING"}>
          <Button type="link" disabled={record.status !== "PENDING"}>模拟认领</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <BackofficePage breadcrumbs={["统一结算 V0.3", "待认领积分"]} title="手机号待认领积分" description="未注册用户只保存脱敏手机号和不可逆 Mock 哈希；验证匹配后才能幂等认领。">
      {error ? <Alert type="error" showIcon message="待认领账户加载失败" description={error} /> : null}
      <Alert type="info" showIcon message="隐私保护" description="此页面不展示、不持久化完整手机号；“模拟认领”使用 service 内部测试身份完成匹配。" />
      <LedgerTable rowKey="id" columns={columns} dataSource={records} loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1350 }} />
    </BackofficePage>
  );
}
