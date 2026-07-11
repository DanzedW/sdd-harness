// pages/QrCodePage.tsx — 收款码管理

import React, { useCallback, useState } from "react";
import { Tag, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { QrCode } from "../domain";
import { qrCodeService } from "../services/merchantLifecycleService";

const columns: ColumnsType<QrCode> = [
  { title: "码编码", dataIndex: "code", key: "code", width: 160 },
  { title: "店铺ID", dataIndex: "shopId", key: "shopId", width: 100 },
  { title: "类型", dataIndex: "type", key: "type", width: 90 },
  { title: "固定金额", key: "fixedAmount", width: 100, render: (_: unknown, r: QrCode) => r.type === "固定金额" ? `¥${((r.fixedAmount || 0) / 100).toFixed(2)}` : "-" },
  { title: "云喇叭", dataIndex: "boundDevice", key: "boundDevice", width: 120, render: (v: string | undefined) => v || "未绑定" },
  { title: "状态", dataIndex: "status", key: "status", width: 80, render: (v: string) => <Tag color={v === "启用" ? "green" : "red"}>{v}</Tag> },
];

const QrCodePage: React.FC = () => {
  const [records, setRecords] = useState<QrCode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await qrCodeService.query({ page, pageSize: 10 }); setRecords(r.items); setTotal(r.total); } finally { setLoading(false); }
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <BackofficePage breadcrumbs={["商户管理", "收款码管理"]} title="收款码管理">
      <InlineFilterBar filters={[{ key: "keyword", label: "搜索", children: <Input placeholder="搜索码编码" /> }]} />
      <LedgerTable<QrCode> columns={columns} dataSource={records} loading={loading} pagination={{ total, current: page, pageSize: 10, onChange: setPage }} />
    </BackofficePage>
  );
};

export default QrCodePage;
