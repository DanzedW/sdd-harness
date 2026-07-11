import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, Modal, Select, Space, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import { adminService } from "../services/adminService";
import type { Order, QueryParams } from "../types";
import { OrderStatus, OrderStatusColor, OrderStatusLabel, OrderTypeLabel } from "../types";

// 快递公司选项
const trackingCompanyOptions = [
  "顺丰速运",
  "中通快递",
  "圆通速递",
  "韵达快递",
  "京东快递",
  "极兔速递",
  "邮政EMS",
  "德邦快递",
];

export function LogisticsPage() {
  const [records, setRecords] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [trackingCompany, setTrackingCompany] = useState<string>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [shipOrder, setShipOrder] = useState<Order | null>(null);
  const [shipForm] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: QueryParams = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (trackingCompany) params.trackingCompany = trackingCompany;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const result = await adminService.logisticsOrders(params);
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [keyword, trackingCompany, dateFrom, dateTo, page, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleReset = useCallback(() => {
    setKeyword("");
    setTrackingCompany(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  }, []);

  const openShipModal = useCallback((record: Order) => {
    setShipOrder(record);
    shipForm.resetFields();
    setShipModalOpen(true);
  }, [shipForm]);

  const handleShip = useCallback(async () => {
    if (!shipOrder) return;
    try {
      const values = await shipForm.validateFields();
      await adminService.shipOrder(shipOrder.id, values.trackingCompany, values.trackingNo);
      message.success("发货成功");
      setShipModalOpen(false);
      await loadData();
    } catch {
      // 表单校验失败不做处理
    }
  }, [shipOrder, shipForm, loadData]);

  const columns: ColumnsType<Order> = useMemo(
    () => [
      {
        title: "订单号",
        dataIndex: "orderNo",
        width: 180,
        fixed: "left",
      },
      {
        title: "商品",
        dataIndex: "productName",
        width: 160,
        ellipsis: true,
      },
      {
        title: "收货人",
        dataIndex: "consigneeName",
        width: 100,
        render: (value: string) => value || "-",
      },
      {
        title: "电话",
        dataIndex: "consigneePhone",
        width: 130,
        render: (value: string) => value || "-",
      },
      {
        title: "地址",
        dataIndex: "consigneeAddr",
        width: 200,
        ellipsis: true,
        render: (value: string) => value || "-",
      },
      {
        title: "快递公司",
        dataIndex: "trackingCompany",
        width: 120,
        render: (value: string) => value || "-",
      },
      {
        title: "快递单号",
        dataIndex: "trackingNo",
        width: 150,
        render: (value: string) => value || "-",
      },
      {
        title: "发货状态",
        dataIndex: "orderStatus",
        width: 100,
        render: (value: OrderStatus) => {
          if (value === OrderStatus.PENDING_DELIVERY) return <Tag color="orange">待发货</Tag>;
          if (value === OrderStatus.SHIPPED) return <Tag color="blue">已发货</Tag>;
          return <Tag>{OrderStatusLabel[value] ?? "未知"}</Tag>;
        },
      },
      {
        title: "下单时间",
        dataIndex: "createdAt",
        width: 170,
      },
      {
        title: "操作",
        width: 120,
        fixed: "right",
        render: (_, record) => (
          <Space>
            {record.orderStatus === OrderStatus.PENDING_DELIVERY && (
              <Button type="link" icon={<PlusOutlined />} onClick={() => openShipModal(record)}>
                发货
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [openShipModal],
  );

  return (
    <BackofficePage
      breadcrumbs={["订单管理", "物流管理"]}
      title="物流管理"
      description="实物订单履约台账，管理待发货和已发货订单，发货信息通过弹窗录入。"
    >
      <InlineFilterBar onSearch={() => setPage(1)} onReset={handleReset}>
        <Form.Item label="关键词">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="商品名/快递公司/单号"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ width: 240 }}
          />
        </Form.Item>
        <Form.Item label="快递公司">
          <Select
            allowClear
            placeholder="请选择"
            value={trackingCompany}
            onChange={(value) => {
              setTrackingCompany(value);
              setPage(1);
            }}
            options={trackingCompanyOptions.map((item) => ({ label: item, value: item }))}
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
        scroll={{ x: 1500 }}
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

      {/* 发货弹窗 */}
      <Modal
        title="录入发货信息"
        open={shipModalOpen}
        onCancel={() => setShipModalOpen(false)}
        onOk={handleShip}
        destroyOnClose
        width={480}
      >
        <Form form={shipForm} layout="vertical">
          <Form.Item
            label="快递公司"
            name="trackingCompany"
            rules={[{ required: true, message: "请选择快递公司" }]}
          >
            <Select
              placeholder="请选择快递公司"
              options={trackingCompanyOptions.map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>
          <Form.Item
            label="快递单号"
            name="trackingNo"
            rules={[{ required: true, message: "请输入快递单号" }]}
          >
            <Input placeholder="请输入快递单号" />
          </Form.Item>
        </Form>
      </Modal>
    </BackofficePage>
  );
}
