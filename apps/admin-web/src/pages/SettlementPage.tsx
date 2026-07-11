import { SearchOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, Select, Space, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { DetailModal } from "../components/backoffice/DetailModal";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import { adminService } from "../services/adminService";
import type { Order, OrderStatus as OrderStatusEnum, QueryParams } from "../types";
import { OrderStatus, OrderStatusLabel, OrderTypeLabel } from "../types";

// 将分转换为元并格式化为 ¥xx.xx
function formatAmount(cents: number): string {
  const yuan = (cents / 100).toFixed(2);
  return "¥" + yuan;
}

// 结算状态
const settlementStatusOptions = [
  { label: "待结算", value: "pending" },
  { label: "已结算", value: "settled" },
];

function getSettlementStatus(order: Order): { label: string; color: string } {
  if (order.orderStatus === OrderStatus.REFUNDED) return { label: "已结算", color: "default" };
  if (order.completedAt) return { label: "待结算", color: "orange" };
  return { label: "待结算", color: "orange" };
}

export function SettlementPage() {
  const [records, setRecords] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [merchantKeyword, setMerchantKeyword] = useState<string>();
  const [settlementStatus, setSettlementStatus] = useState<string>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Order | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: QueryParams = { page, pageSize };
      if (merchantKeyword) params.keyword = merchantKeyword;
      if (settlementStatus) params.settlementStatus = settlementStatus;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const result = await adminService.settleOrders(params);
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [merchantKeyword, settlementStatus, dateFrom, dateTo, page, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleReset = useCallback(() => {
    setMerchantKeyword(undefined);
    setSettlementStatus(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  }, []);

  const handleViewDetail = useCallback((record: Order) => {
    setDetailRecord(record);
    setDetailOpen(true);
  }, []);

  const handleSettle = useCallback(
    async (orderId: string) => {
      await adminService.submitSettlement(orderId);
      await loadData();
    },
    [loadData],
  );

  const columns: ColumnsType<Order> = useMemo(
    () => [
      {
        title: "订单号",
        dataIndex: "orderNo",
        width: 180,
        fixed: "left",
      },
      {
        title: "商户",
        dataIndex: "merchantName",
        width: 130,
      },
      {
        title: "商品",
        dataIndex: "productName",
        width: 160,
        ellipsis: true,
      },
      {
        title: "订单金额",
        dataIndex: "payAmount",
        width: 110,
        render: (value: number) => formatAmount(value),
      },
      {
        title: "佣金",
        dataIndex: "commissionAmount",
        width: 100,
        render: (value: number) => formatAmount(value),
      },
      {
        title: "结算金额",
        dataIndex: "settleAmount",
        width: 110,
        sorter: (a, b) => a.settleAmount - b.settleAmount,
        render: (value: number) => formatAmount(value),
      },
      {
        title: "结算状态",
        width: 100,
        render: (_, record) => {
          const s = getSettlementStatus(record);
          return <Tag color={s.color}>{s.label}</Tag>;
        },
      },
      {
        title: "履约类型",
        dataIndex: "orderType",
        width: 100,
        render: (value: number) => OrderTypeLabel[value] ?? "未知",
      },
      {
        title: "完成时间",
        dataIndex: "completedAt",
        width: 170,
        render: (value: string) => value || "-",
      },
      {
        title: "操作",
        width: 160,
        fixed: "right",
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => handleViewDetail(record)}>
              查看
            </Button>
            {record.orderStatus === OrderStatus.COMPLETED && (
              <Button type="link" onClick={() => handleSettle(record.id)}>
                发起结算
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [handleViewDetail, handleSettle],
  );

  return (
    <BackofficePage
      breadcrumbs={["财务管理", "结算管理"]}
      title="结算管理"
      description="商家结算台账，展示已完成和已退款订单，发起结算为本地 Mock 操作。"
    >
      <InlineFilterBar onSearch={() => setPage(1)} onReset={handleReset}>
        <Form.Item label="商户名称">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索商户名称"
            value={merchantKeyword}
            onChange={(event) => setMerchantKeyword(event.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ width: 220 }}
          />
        </Form.Item>
        <Form.Item label="结算状态">
          <Select
            allowClear
            placeholder="请选择"
            value={settlementStatus}
            onChange={(value) => {
              setSettlementStatus(value);
              setPage(1);
            }}
            options={settlementStatusOptions}
            style={{ width: 130 }}
          />
        </Form.Item>
        <Form.Item label="完成时间">
          <DatePicker
            placeholder="开始日期"
            value={dateFrom ? dayjs(dateFrom) : null}
            onChange={(date) => {
              setDateFrom(date ? date.format("YYYY-MM-DD") : undefined);
              setPage(1);
            }}
          />
        </Form.Item>
        <Form.Item label="至">
          <DatePicker
            placeholder="结束日期"
            value={dateTo ? dayjs(dateTo) : null}
            onChange={(date) => {
              setDateTo(date ? date.format("YYYY-MM-DD") : undefined);
              setPage(1);
            }}
          />
        </Form.Item>
      </InlineFilterBar>

      <LedgerTable<Order>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={records}
        scroll={{ x: 1400 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (value) => "共 " + value + " 条 Mock 数据",
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
      />

      <DetailModal
        title={"订单详情 - " + (detailRecord?.orderNo ?? "")}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={800}
      >
        {detailRecord && <SettlementDetailContent order={detailRecord} />}
      </DetailModal>
    </BackofficePage>
  );
}

function SettlementDetailContent({ order }: { order: Order }) {
  const items: Array<{ label: string; value: string }> = [
    { label: "订单号", value: order.orderNo },
    { label: "用户", value: order.userName + "(" + order.userId + ")" },
    { label: "商户", value: order.merchantName + "(" + order.merchantId + ")" },
    { label: "商品", value: order.productName + " × " + order.quantity },
    { label: "订单类型", value: OrderTypeLabel[order.orderType] ?? String(order.orderType) },
    { label: "订单状态", value: OrderStatusLabel[order.orderStatus] ?? String(order.orderStatus) },
    { label: "结算状态", value: getSettlementStatus(order).label },
    { label: "订单总金额", value: formatAmount(order.totalAmount) },
    { label: "运费", value: formatAmount(order.freightAmount) },
    { label: "优惠减免", value: formatAmount(order.discountAmount) },
    { label: "现金实付", value: formatAmount(order.payAmount) },
    { label: "金币抵扣", value: order.coinCount ? formatAmount(order.coinAmount) + "(" + order.coinCount + "金币)" : "-" },
    { label: "平台佣金", value: formatAmount(order.commissionAmount) },
    { label: "应结算金额", value: formatAmount(order.settleAmount) },
    { label: "支付方式", value: String(order.paymentMethod) },
    { label: "支付时间", value: order.paidAt || "-" },
    { label: "完成时间", value: order.completedAt || "-" },
    { label: "退款金额", value: order.refundAmount ? formatAmount(order.refundAmount) : "-" },
    { label: "退款时间", value: order.refundedAt || "-" },
    { label: "取消原因", value: order.cancelReason || "-" },
    { label: "备注", value: order.remark || "-" },
  ];

  return (
    <div className="detail-grid">
      {items.map((item) => (
        <div className="detail-item" key={item.label}>
          <span className="detail-label">{item.label}：</span>
          <span className="detail-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
