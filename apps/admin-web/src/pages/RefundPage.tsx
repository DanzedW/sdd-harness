import { SearchOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { DetailModal } from "../components/backoffice/DetailModal";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import { adminService } from "../services/adminService";
import type { Order, QueryParams } from "../types";
import { OrderStatus, OrderStatusColor, OrderStatusLabel, OrderTypeLabel } from "../types";

// 将分转换为元并格式化为 ¥xx.xx
function formatAmount(cents: number): string {
  const yuan = (cents / 100).toFixed(2);
  return "¥" + yuan;
}

// 退款状态映射
const refundStatusOptions = [
  { label: "退款中", value: "1" },
  { label: "已退款", value: "2" },
  { label: "部分退款", value: "3" },
  { label: "退款失败", value: "4" },
];

function getRefundStatusLabel(status: number): string {
  const map: Record<number, string> = {
    1: "退款中",
    2: "已退款",
    3: "部分退款",
    4: "退款失败",
  };
  return map[status] ?? "未知";
}

function getRefundStatusColor(status: number): string {
  const map: Record<number, string> = {
    1: "orange",
    2: "default",
    3: "volcano",
    4: "red",
  };
  return map[status] ?? "default";
}

export function RefundPage() {
  const [records, setRecords] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [refundStatus, setRefundStatus] = useState<string>();
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
      if (keyword) params.keyword = keyword;
      if (refundStatus !== undefined) params.refundStatus = Number(refundStatus);
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const result = await adminService.refundOrders(params);
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [keyword, refundStatus, dateFrom, dateTo, page, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleReset = useCallback(() => {
    setRefundStatus(undefined);
    setKeyword("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  }, []);

  const handleViewDetail = useCallback((record: Order) => {
    setDetailRecord(record);
    setDetailOpen(true);
  }, []);

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
        title: "退款金额",
        dataIndex: "refundAmount",
        width: 110,
        sorter: (a, b) => a.refundAmount - b.refundAmount,
        render: (value: number) => formatAmount(value),
      },
      {
        title: "退款状态",
        dataIndex: "refundStatus",
        width: 100,
        render: (value: number) => (
          <Tag color={getRefundStatusColor(value)}>{getRefundStatusLabel(value)}</Tag>
        ),
      },
      {
        title: "订单状态",
        dataIndex: "orderStatus",
        width: 100,
        render: (value: OrderStatus) => (
          <Tag color={OrderStatusColor[value] ?? "default"}>{OrderStatusLabel[value] ?? "未知"}</Tag>
        ),
      },
      {
        title: "退款时间",
        dataIndex: "refundedAt",
        width: 170,
        render: (value: string) => value || "-",
      },
      {
        title: "原因",
        dataIndex: "cancelReason",
        width: 160,
        ellipsis: true,
        render: (value: string) => value || "-",
      },
      {
        title: "操作",
        width: 100,
        fixed: "right",
        render: (_, record) => (
          <Button type="link" onClick={() => handleViewDetail(record)}>
            查看
          </Button>
        ),
      },
    ],
    [handleViewDetail],
  );

  return (
    <BackofficePage
      breadcrumbs={["订单管理", "退款管理"]}
      title="退款管理"
      description="退款台账展示有退款记录的订单，保留退款状态、金额、时间和异常原因。"
    >
      <InlineFilterBar onSearch={() => setPage(1)} onReset={handleReset}>
        <Form.Item label="订单编号">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="订单号/商户/商品"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ width: 220 }}
          />
        </Form.Item>
        <Form.Item label="退款状态">
          <Select
            allowClear
            placeholder="请选择"
            value={refundStatus}
            onChange={(value) => {
              setRefundStatus(value);
              setPage(1);
            }}
            options={refundStatusOptions}
            style={{ width: 140 }}
          />
        </Form.Item>
        <Form.Item label="退款时间">
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
        scroll={{ x: 1300 }}
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
        {detailRecord && <RefundDetailContent order={detailRecord} />}
      </DetailModal>
    </BackofficePage>
  );
}

function RefundDetailContent({ order }: { order: Order }) {
  const items: Array<{ label: string; value: string }> = [
    { label: "订单号", value: order.orderNo },
    { label: "用户", value: order.userName + "(" + order.userId + ")" },
    { label: "商户", value: order.merchantName + "(" + order.merchantId + ")" },
    { label: "商品", value: order.productName + " × " + order.quantity },
    { label: "订单类型", value: OrderTypeLabel[order.orderType] ?? String(order.orderType) },
    { label: "订单状态", value: OrderStatusLabel[order.orderStatus] ?? String(order.orderStatus) },
    { label: "实付金额", value: formatAmount(order.payAmount) },
    { label: "退款金额", value: formatAmount(order.refundAmount) },
    { label: "退款状态", value: getRefundStatusLabel(order.refundStatus) },
    { label: "退款时间", value: order.refundedAt || "-" },
    { label: "取消原因", value: order.cancelReason || "-" },
    { label: "取消操作人", value: order.cancelOperator || "-" },
    { label: "备注", value: order.remark || "-" },
    { label: "支付时间", value: order.paidAt || "-" },
    { label: "完成时间", value: order.completedAt || "-" },
    { label: "关闭时间", value: order.closedAt || "-" },
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
