import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Tag,
  message,
} from "antd";
import type { FormInstance } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { DetailModal } from "../components/backoffice/DetailModal";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import { adminService } from "../services/adminService";
import type { Order, OrderStatus as OrderStatusEnum, QueryParams } from "../types";
import { OrderStatus, OrderStatusColor, OrderStatusLabel, OrderTypeLabel } from "../types";
import { ORDER_STATUS_TRANSITIONS } from "../constants/orderStatusMachine";

// 将分转换为元并格式化为 ¥xx.xx
function formatAmount(cents: number): string {
  const yuan = (cents / 100).toFixed(2);
  return "¥" + yuan;
}

// 自动生成订单号
function generateOrderNo(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const seq = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  return `DL${dateStr}${seq}`;
}

// 可编辑的订单字段（创建/编辑表单用）
interface OrderFormValues {
  orderNo: string;
  orderType: number;
  userName: string;
  merchantName: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  freightAmount: number;
  discountAmount: number;
  payAmount: number;
  coinAmount: number;
  coinCount: number;
  orderStatus: OrderStatusEnum;
  paymentMethod: number;
  paidAt: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeAddr: string;
  trackingNo: string;
  trackingCompany: string;
  remark: string;
}

const orderStatusOptions = Object.entries(OrderStatusLabel).map(([value, label]) => ({
  label,
  value: Number(value),
}));

const orderTypeOptions = Object.entries(OrderTypeLabel).map(([value, label]) => ({
  label,
  value: Number(value),
}));

export function OrderPage() {
  const [records, setRecords] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [orderStatus, setOrderStatus] = useState<OrderStatusEnum | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Order | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: QueryParams = { keyword, page, pageSize };
      if (orderStatus !== undefined) params.orderStatus = orderStatus;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const result = await adminService.orders(params);
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [keyword, orderStatus, dateFrom, dateTo, page, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleReset = useCallback(() => {
    setKeyword("");
    setOrderStatus(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  }, []);

  const handleEdit = useCallback(
    (record: Order) => {
      setEditing(record);
      form.setFieldsValue(record);
      setModalOpen(true);
    },
    [form],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await adminService.removeOrder(id);
      message.success("已从本地 Mock 数据中删除");
      await loadData();
    },
    [loadData],
  );

  const handleSave = useCallback(async () => {
    const values = form.getFieldsValue() as OrderFormValues;

    // 状态机校验（编辑模式）
    if (editing && editing.orderStatus !== values.orderStatus) {
      const fromStatus = editing.orderStatus;
      const toStatus = values.orderStatus;
      const allowed = ORDER_STATUS_TRANSITIONS[fromStatus];
      if (!allowed || !allowed.includes(toStatus)) {
        message.error(`非法状态转换：${OrderStatusLabel[fromStatus] ?? fromStatus} → ${OrderStatusLabel[toStatus] ?? toStatus}`);
        return;
      }
    }

    if (editing) {
      await adminService.saveOrder({ ...editing, ...values } as Order);
      message.success("已写入本地 Mock 数据");
    } else {
      const item = {
        id: "MOCK-" + Date.now(),
        status: "启用",
        updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
        userId: "MOCK",
        merchantId: "MOCK",
        shopId: "",
        spuId: "",
        skuId: "",
        productSnapshot: "{}",
        serviceTime: "",
        serviceAddr: "",
        verifyCode: "",
        verifiedAt: "",
        paymentChannel: 1,
        paymentId: "",
        commissionAmount: 0,
        settleAmount: 0,
        orderSource: 0,
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
        shippedAt: "",
        receivedAt: "",
        completedAt: "",
        closedAt: "",
        refundStatus: 0,
        refundAmount: 0,
        refundedAt: "",
        cancelReason: "",
        cancelOperator: "",
        idempotentKey: "idem-" + Date.now(),
        ...values,
        // 新增时自动生成订单号，覆盖手动输入
        orderNo: generateOrderNo(),
      } as Order;
      await adminService.saveOrder(item);
      message.success("已写入本地 Mock 数据");
    }
    setModalOpen(false);
    await loadData();
  }, [editing, form, loadData]);

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
        title: "用户",
        dataIndex: "userName",
        width: 100,
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
        title: "金额",
        dataIndex: "totalAmount",
        width: 110,
        sorter: (a, b) => a.totalAmount - b.totalAmount,
        render: (value: number) => formatAmount(value),
      },
      {
        title: "实付",
        dataIndex: "payAmount",
        width: 100,
        render: (value: number) => formatAmount(value),
      },
      {
        title: "状态",
        dataIndex: "orderStatus",
        width: 100,
        filters: orderStatusOptions.map((opt) => ({ text: opt.label, value: opt.value })),
        onFilter: (value, record) => record.orderStatus === value,
        render: (value: OrderStatusEnum) => (
          <Tag color={OrderStatusColor[value] ?? "default"}>{OrderStatusLabel[value] ?? "未知"}</Tag>
        ),
      },
      {
        title: "履约类型",
        dataIndex: "orderType",
        width: 100,
        render: (value: number) => OrderTypeLabel[value] ?? "未知",
      },
      {
        title: "支付时间",
        dataIndex: "paidAt",
        width: 170,
        render: (value: string) => value || "-",
      },
      {
        title: "更新时间",
        dataIndex: "updatedAt",
        width: 170,
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
            <Button type="link" onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <Popconfirm
              title="确认删除？"
              description="删除会写入本地 Mock 数据，刷新后仍然生效。"
              okText="删除"
              cancelText="取消"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleEdit, handleDelete, handleViewDetail],
  );

  return (
    <BackofficePage
      breadcrumbs={["订单管理", "订单列表"]}
      title="订单管理"
      description="订单台账支持按状态、关键词和支付时间筛选，状态变更遵循本地状态机校验。"
      actions={
        <>
          <Button onClick={() => message.info("导出订单为 Mock 入口，后续接入文件下载")}>导出订单</Button>
          <Button onClick={() => message.info("批量导入单号为 Mock 入口，后续接入上传弹窗")}>批量导入单号</Button>
          <Button onClick={() => message.info("下载模板为 Mock 入口，后续接入静态模板")}>下载批量导入模板</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setModalOpen(true);
            }}
          >
            新增订单
          </Button>
        </>
      }
    >
      <Radio.Group
        className="status-filter-line"
        value={orderStatus ?? "all"}
        onChange={(event) => {
          setOrderStatus(event.target.value === "all" ? undefined : event.target.value);
          setPage(1);
        }}
        optionType="button"
        buttonStyle="solid"
        options={[
          { label: "全部", value: "all" },
          ...orderStatusOptions.map((item) => ({ label: item.label, value: item.value })),
        ]}
      />

      <InlineFilterBar onSearch={() => setPage(1)} onReset={handleReset}>
        <Form.Item label="订单编号">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="订单号/用户/商户/商品"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ width: 240 }}
          />
        </Form.Item>
        <Form.Item label="订单状态">
          <Select
            allowClear
            placeholder="请选择"
            value={orderStatus}
            onChange={(value) => {
              setOrderStatus(value);
              setPage(1);
            }}
            options={orderStatusOptions}
            style={{ width: 140 }}
          />
        </Form.Item>
        <Form.Item label="下单时间">
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
        scroll={{ x: 1600 }}
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
        {detailRecord && <OrderDetailContent order={detailRecord} />}
      </DetailModal>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editing ? "编辑订单" : "新增订单"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        destroyOnClose
        width={700}
      >
        <OrderFormFields form={form} record={editing} />
      </Modal>
    </BackofficePage>
  );
}

// 详情展示组件
function OrderDetailContent({ order }: { order: Order }) {
  const items: Array<{ label: string; value: string }> = [
    { label: "订单号", value: order.orderNo },
    { label: "用户", value: order.userName + "(" + order.userId + ")" },
    { label: "商户", value: order.merchantName + "(" + order.merchantId + ")" },
    { label: "店铺", value: order.shopId || "-" },
    { label: "商品", value: order.productName + " × " + order.quantity },
    { label: "订单类型", value: OrderTypeLabel[order.orderType] ?? String(order.orderType) },
    { label: "订单状态", value: OrderStatusLabel[order.orderStatus] ?? String(order.orderStatus) },
    { label: "订单总金额", value: formatAmount(order.totalAmount) },
    { label: "运费", value: formatAmount(order.freightAmount) },
    { label: "优惠减免", value: formatAmount(order.discountAmount) },
    { label: "现金实付", value: formatAmount(order.payAmount) },
    { label: "金币抵扣", value: order.coinCount ? formatAmount(order.coinAmount) + "(" + order.coinCount + "金币)" : "-" },
    { label: "平台佣金", value: formatAmount(order.commissionAmount) },
    { label: "应结算金额", value: formatAmount(order.settleAmount) },
    { label: "支付方式", value: getPaymentMethodLabel(order.paymentMethod) },
    { label: "支付时间", value: order.paidAt || "-" },
    { label: "支付单号", value: order.paymentId || "-" },
    { label: "收货人", value: order.consigneeName || "-" },
    { label: "联系电话", value: order.consigneePhone || "-" },
    { label: "收货地址", value: order.consigneeAddr || "-" },
    { label: "快递公司", value: order.trackingCompany || "-" },
    { label: "快递单号", value: order.trackingNo || "-" },
    { label: "核销码", value: order.verifyCode || "-" },
    { label: "核销时间", value: order.verifiedAt || "-" },
    { label: "预约服务时间", value: order.serviceTime || "-" },
    { label: "服务地址", value: order.serviceAddr || "-" },
    { label: "提单时间", value: order.createdAt },
    { label: "发货时间", value: order.shippedAt || "-" },
    { label: "完成时间", value: order.completedAt || "-" },
    { label: "关闭时间", value: order.closedAt || "-" },
    { label: "退款金额", value: order.refundAmount ? formatAmount(order.refundAmount) : "-" },
    { label: "退款时间", value: order.refundedAt || "-" },
    { label: "取消原因", value: order.cancelReason || "-" },
    { label: "备注", value: order.remark || "-" },
    { label: "幂等键", value: order.idempotentKey },
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

function getPaymentMethodLabel(method: number): string {
  const labels: Record<number, string> = {
    0: "未支付",
    1: "微信支付",
    2: "支付宝",
    3: "银联",
    4: "数字人民币",
    5: "纯金币",
    6: "混合支付",
  };
  return labels[method] ?? "未知(" + method + ")";
}

// 表单字段组件
function OrderFormFields({ form, record }: { form: FormInstance; record: Order | null }) {
  useEffect(() => {
    if (record) {
      form.setFieldsValue(record);
    }
  }, [record, form]);

  return (
    <Form form={form} layout="vertical">
      <Form.Item label="订单号" name="orderNo" rules={[{ required: true, message: "请输入订单号" }]}>
        <Input />
      </Form.Item>
      <Form.Item label="用户" name="userName" rules={[{ required: true, message: "请输入用户" }]}>
        <Input />
      </Form.Item>
      <Form.Item label="商户" name="merchantName" rules={[{ required: true, message: "请输入商户" }]}>
        <Input />
      </Form.Item>
      <Form.Item label="商品" name="productName" rules={[{ required: true, message: "请输入商品" }]}>
        <Input />
      </Form.Item>
      <Form.Item label="数量" name="quantity" rules={[{ required: true, message: "请输入数量" }]}>
        <Input type="number" />
      </Form.Item>
      <Form.Item label="订单总金额（分）" name="totalAmount" rules={[{ required: true, message: "请输入金额" }]}>
        <Input type="number" />
      </Form.Item>
      <Form.Item label="运费（分）" name="freightAmount">
        <Input type="number" />
      </Form.Item>
      <Form.Item label="优惠减免（分）" name="discountAmount">
        <Input type="number" />
      </Form.Item>
      <Form.Item label="实付金额（分）" name="payAmount" rules={[{ required: true, message: "请输入实付金额" }]}>
        <Input type="number" />
      </Form.Item>
      <Form.Item label="金币抵扣（分）" name="coinAmount">
        <Input type="number" />
      </Form.Item>
      <Form.Item label="金币数量" name="coinCount">
        <Input type="number" />
      </Form.Item>
      <Form.Item label="订单状态" name="orderStatus" rules={[{ required: true, message: "请选择订单状态" }]}>
        <Select options={orderStatusOptions} />
      </Form.Item>
      <Form.Item label="履约类型" name="orderType" rules={[{ required: true, message: "请选择履约类型" }]}>
        <Select options={orderTypeOptions} />
      </Form.Item>
      <Form.Item label="支付方式" name="paymentMethod">
        <Select
          options={[
            { label: "未支付", value: 0 },
            { label: "微信支付", value: 1 },
            { label: "支付宝", value: 2 },
            { label: "银联", value: 3 },
            { label: "数字人民币", value: 4 },
            { label: "纯金币", value: 5 },
            { label: "混合支付", value: 6 },
          ]}
        />
      </Form.Item>
      <Form.Item label="支付时间" name="paidAt">
        <Input placeholder="YYYY-MM-DD HH:mm:ss" />
      </Form.Item>
      <Form.Item label="收货人" name="consigneeName">
        <Input />
      </Form.Item>
      <Form.Item label="联系电话" name="consigneePhone">
        <Input />
      </Form.Item>
      <Form.Item label="收货地址" name="consigneeAddr">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label="快递公司" name="trackingCompany">
        <Input />
      </Form.Item>
      <Form.Item label="快递单号" name="trackingNo">
        <Input />
      </Form.Item>
      <Form.Item label="备注" name="remark">
        <Input.TextArea rows={2} />
      </Form.Item>
    </Form>
  );
}
