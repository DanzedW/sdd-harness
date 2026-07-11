// pages/ContractPage.tsx — 合同管理

import React, { useCallback, useState } from "react";
import { Tag, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { Contract } from "../domain";
import { contractService } from "../services/merchantLifecycleService";

const columns: ColumnsType<Contract> = [
  { title: "合同编号", dataIndex: "contractNo", key: "contractNo", width: 130 },
  { title: "商户ID", dataIndex: "merchantId", key: "merchantId", width: 100 },
  { title: "有效起", dataIndex: "validFrom", key: "validFrom", width: 110 },
  { title: "有效止", dataIndex: "validTo", key: "validTo", width: 110 },
  { title: "手续费(基点)", dataIndex: "feeRateBps", key: "feeRateBps", width: 110 },
  { title: "结算费率(基点)", dataIndex: "settlementRateBps", key: "settlementRateBps", width: 120 },
  { title: "结算周期", dataIndex: "settlementCycleType", key: "settlementCycleType", width: 120 },
  { title: "状态", dataIndex: "status", key: "status", width: 80, render: (v: string) => <Tag color={v === "生效" ? "green" : "default"}>{v}</Tag> },
];

const ContractPage: React.FC = () => {
  const [records, setRecords] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await contractService.query({ page, pageSize: 10 });
      setRecords(r.items); setTotal(r.total);
    } finally { setLoading(false); }
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <BackofficePage breadcrumbs={["商户管理", "合同管理"]} title="合同管理">
      <InlineFilterBar filters={[{ key: "keyword", label: "搜索", children: <Input placeholder="搜索合同编号" /> }]} />
      <LedgerTable<Contract> columns={columns} dataSource={records} loading={loading} pagination={{ total, current: page, pageSize: 10, onChange: setPage }} />
    </BackofficePage>
  );
};

export default ContractPage;
