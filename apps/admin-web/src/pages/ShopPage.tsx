// pages/ShopPage.tsx — 店铺管理

import React, { useCallback, useState } from "react";
import { Tag, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { Shop } from "../domain";
import { shopService } from "../services/merchantLifecycleService";

const columns: ColumnsType<Shop> = [
  { title: "店铺编码", dataIndex: "shopCode", key: "shopCode", width: 110 },
  { title: "名称", dataIndex: "name", key: "name", width: 140 },
  { title: "商户ID", dataIndex: "merchantId", key: "merchantId", width: 100 },
  { title: "扣点(基点)", dataIndex: "platformRateBps", key: "platformRateBps", width: 110 },
  { title: "联系人", dataIndex: "contactName", key: "contactName", width: 100 },
  { title: "电话", dataIndex: "contactPhone", key: "contactPhone", width: 120 },
  {
    title: "金币", dataIndex: "supportCoin", key: "supportCoin", width: 80,
    render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "支持" : "不支持"}</Tag>,
  },
  {
    title: "状态", dataIndex: "status", key: "status", width: 80,
    render: (v: string) => <Tag color={v === "启用" ? "green" : "red"}>{v}</Tag>,
  },
];

const ShopPage: React.FC = () => {
  const [records, setRecords] = useState<Shop[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await shopService.query({ keyword, page, pageSize: 10 });
      setRecords(r.items);
      setTotal(r.total);
    } finally { setLoading(false); }
  }, [keyword, page]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <BackofficePage breadcrumbs={["商户管理", "店铺管理"]} title="店铺管理">
      <InlineFilterBar filters={[{
        key: "keyword", label: "搜索",
        children: <Input placeholder="搜索店铺编码或名称" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={load} />,
      }]} />
      <LedgerTable<Shop>
        columns={columns}
        dataSource={records}
        loading={loading}
        pagination={{ total, current: page, pageSize: 10, onChange: (p) => setPage(p) }}
      />
    </BackofficePage>
  );
};

export default ShopPage;
