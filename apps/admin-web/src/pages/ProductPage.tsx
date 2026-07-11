import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import DOMPurify from "dompurify";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { DetailModal } from "../components/backoffice/DetailModal";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import { adminService } from "../services/adminService";
import type {
  Merchant,
  Product,
  ProductSKU,
  ProductStatus,
  QueryParams,
} from "../types";
import {
  ProductStatusColor,
  ProductTypeColor,
  ProductTypeOptions,
} from "../types";

// 将分转换为元并格式化为 ¥xx.xx
function formatAmount(cents: number): string {
  const yuan = (cents / 100).toFixed(2);
  return "¥" + yuan;
}
// 解析图片 JSON
function parseImages(images: string): string[] {
  try {
    return JSON.parse(images) as string[];
  } catch {
    return [];
  }
}

export function ProductPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [productTypeFilter, setProductTypeFilter] = useState<
    string | undefined
  >();
  const [merchantFilter, setMerchantFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Product | null>(null);
  const [detailSKUs, setDetailSKUs] = useState<ProductSKU[]>([]);
  // SKU 编辑弹窗
  const [skuModalOpen, setSkuModalOpen] = useState(false);
  const [skuEditing, setSkuEditing] = useState<ProductSKU | null>(null);
  const [skuProductId, setSkuProductId] = useState<string>("");
  const [skuForm] = Form.useForm();
  // 下拉选项
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: QueryParams = { keyword, page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (productTypeFilter) params.productType = productTypeFilter;
      if (merchantFilter) params.merchantId = merchantFilter;
      const result = await adminService.products(params);
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
    statusFilter,
    productTypeFilter,
    merchantFilter,
    page,
    pageSize,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // 加载下拉选项
  useEffect(() => {
    void (async () => {
      const merchantList = await adminService.getAllMerchants();
      setMerchants(merchantList);
    })();
  }, []);

  const handleReset = useCallback(() => {
    setKeyword("");
    setStatusFilter(undefined);
    setProductTypeFilter(undefined);
    setMerchantFilter(undefined);
    setPage(1);
  }, []);

  const handleEdit = useCallback(
    (record: Product) => {
      navigate(`/products/${record.id}/edit`);
    },
    [navigate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await adminService.removeProduct(id);
      message.success("已从本地 Mock 数据中删除");
      await loadData();
    },
    [loadData],
  );

  const handleViewDetail = useCallback(async (record: Product) => {
    setDetailRecord(record);
    setDetailOpen(true);
    // 查询该商品的 SKU
    const skus = await adminService.getProductSKUs(record.spuId);
    setDetailSKUs(skus);
  }, []);

  // SKU 编辑
  const openSkuModal = useCallback(
    (spuId: string, sku: ProductSKU | null) => {
      setSkuProductId(spuId);
      setSkuEditing(sku);
      skuForm.resetFields();
      if (sku) {
        skuForm.setFieldsValue(sku);
      }
      setSkuModalOpen(true);
    },
    [skuForm],
  );

  const handleSkuSave = useCallback(async () => {
    const values = await skuForm.validateFields();
    if (skuEditing) {
      await adminService.saveProductSKU({
        ...skuEditing,
        ...values,
      } as ProductSKU);
      message.success("SKU 已更新");
    } else {
      await adminService.saveProductSKU({
        id: "SKU-MOCK-" + Date.now(),
        skuId: "SKU-MOCK-" + Date.now(),
        spuId: skuProductId,
        specValues: values.specValues || "[]",
        price: values.price ?? 0,
        stock: values.stock ?? 0,
        sales: 0,
        image: values.image ?? "",
        barcode: values.barcode ?? "",
        sortOrder: values.sortOrder ?? 0,
        status: values.status ?? "启用",
        updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      } as ProductSKU);
      message.success("SKU 已新增");
    }
    setSkuModalOpen(false);
    // 刷新详情中的 SKU
    if (detailRecord) {
      const skus = await adminService.getProductSKUs(detailRecord.spuId);
      setDetailSKUs(skus);
    }
  }, [skuEditing, skuProductId, skuForm, detailRecord]);

  const columns: ColumnsType<Product> = useMemo(
    () => [
      {
        title: "商品编号",
        dataIndex: "spuId",
        width: 120,
        fixed: "left",
      },
      {
        title: "商品名称",
        dataIndex: "spuName",
        width: 180,
        ellipsis: true,
      },
      {
        title: "分类",
        dataIndex: "categoryName",
        width: 120,
      },
      {
        title: "商户",
        dataIndex: "merchantName",
        width: 130,
        ellipsis: true,
      },
      {
        title: "商品类型",
        dataIndex: "productType",
        width: 110,
        render: (value: string) => (
          <Tag
            color={
              ProductTypeColor[value as keyof typeof ProductTypeColor] ??
              "default"
            }
          >
            {value}
          </Tag>
        ),
      },
      {
        title: "售价",
        dataIndex: "price",
        width: 100,
        sorter: (a, b) => a.price - b.price,
        render: (value: number) => formatAmount(value),
      },
      {
        title: "原价",
        dataIndex: "marketPrice",
        width: 100,
        render: (value: number) => (value ? formatAmount(value) : "-"),
      },
      {
        title: "库存",
        dataIndex: "stock",
        width: 80,
      },
      {
        title: "销量",
        dataIndex: "sales",
        width: 80,
      },
      {
        title: "状态",
        dataIndex: "status",
        width: 90,
        render: (value: ProductStatus) => (
          <Tag color={ProductStatusColor[value] ?? "default"}>{value}</Tag>
        ),
      },
      {
        title: "更新时间",
        dataIndex: "updatedAt",
        width: 170,
      },
      {
        title: "操作",
        width: 260,
        fixed: "right",
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => handleViewDetail(record)}>
              查看
            </Button>
            <Button type="link" onClick={() => handleViewDetail(record)}>
              规格设置
            </Button>
            <Button type="link" onClick={() => handleViewDetail(record)}>
              商品图片
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
      breadcrumbs={["商品管理", "商品列表"]}
      title="商品管理"
      description="供应链商品台账，支持按商品类型、状态和商户筛选。"
      actions={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/products/new")}
        >
          新增商品
        </Button>
      }
    >
      <InlineFilterBar onSearch={() => setPage(1)} onReset={handleReset}>
        <Form.Item label="商品名称">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="商品名称/编号/分类/商户"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ width: 240 }}
          />
        </Form.Item>
        <Form.Item label="商品状态">
          <Select
            allowClear
            placeholder="请选择"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={["草稿", "待审核", "上架", "下架"].map((item) => ({
              label: item,
              value: item,
            }))}
            style={{ width: 130 }}
          />
        </Form.Item>
        <Form.Item label="商品类型">
          <Select
            allowClear
            placeholder="请选择"
            value={productTypeFilter}
            onChange={(value) => {
              setProductTypeFilter(value);
              setPage(1);
            }}
            options={ProductTypeOptions.map((item) => ({
              label: item,
              value: item,
            }))}
            style={{ width: 140 }}
          />
        </Form.Item>
        <Form.Item label="所属商户">
          <Select
            allowClear
            placeholder="请选择"
            value={merchantFilter}
            onChange={(value) => {
              setMerchantFilter(value);
              setPage(1);
            }}
            options={merchants.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            style={{ width: 170 }}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </InlineFilterBar>

      <LedgerTable<Product>
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
        title={"商品详情 - " + (detailRecord?.spuName ?? "")}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={800}
      >
        {detailRecord && (
          <ProductDetailContent
            product={detailRecord}
            skus={detailSKUs}
            onAddSku={() => openSkuModal(detailRecord.spuId, null)}
            onEditSku={(sku) => openSkuModal(detailRecord.spuId, sku)}
            onRefreshSkus={async () => {
              const skus = await adminService.getProductSKUs(
                detailRecord.spuId,
              );
              setDetailSKUs(skus);
            }}
          />
        )}
      </DetailModal>

      {/* SKU 编辑弹窗 */}
      <Modal
        title={skuEditing ? "编辑 SKU" : "新增 SKU"}
        open={skuModalOpen}
        onCancel={() => setSkuModalOpen(false)}
        onOk={handleSkuSave}
        destroyOnClose
        width={520}
      >
        <Form form={skuForm} layout="vertical">
          <Form.Item
            label="规格值（JSON）"
            name="specValues"
            rules={[{ required: true, message: "请输入规格值" }]}
            help='如 [{"key":"颜色","value":"红色"}]'
          >
            <Input.TextArea
              rows={2}
              placeholder='[{"key":"颜色","value":"红色"}]'
            />
          </Form.Item>
          <Form.Item
            label="价格（分）"
            name="price"
            rules={[{ required: true, message: "请输入价格" }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="库存"
            name="stock"
            rules={[{ required: true, message: "请输入库存" }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item label="条码" name="barcode">
            <Input />
          </Form.Item>
          <Form.Item label="图片 URL" name="image">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select
              options={[
                { label: "启用", value: "启用" },
                { label: "停用", value: "停用" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </BackofficePage>
  );
}
// 详情展示组件
function ProductDetailContent({
  product,
  skus,
  onAddSku,
  onEditSku,
  onRefreshSkus,
}: {
  product: Product;
  skus: ProductSKU[];
  onAddSku: () => void;
  onEditSku: (sku: ProductSKU) => void;
  onRefreshSkus: () => Promise<void>;
}) {
  const imageList = parseImages(product.images);

  const handleDeleteSku = async (skuId: string) => {
    await adminService.removeProductSKU(skuId);
    message.success("SKU 已删除");
    await onRefreshSkus();
  };

  const items: Array<{ label: string; value: string }> = [
    { label: "SPU 编号", value: product.spuId },
    { label: "SPU 名称", value: product.spuName },
    {
      label: "分类",
      value: product.categoryName + "(" + product.categoryId + ")",
    },
    {
      label: "商户",
      value: product.merchantName + "(" + product.merchantId + ")",
    },
    { label: "商品类型", value: product.productType },
    { label: "售价", value: formatAmount(product.price) },
    {
      label: "原价",
      value: product.marketPrice ? formatAmount(product.marketPrice) : "-",
    },
    { label: "库存", value: String(product.stock) },
    { label: "销量", value: String(product.sales) },
    {
      label: "限购数量",
      value: product.salesLimit ? String(product.salesLimit) : "不限",
    },
    { label: "商品简介", value: product.description || "-" },
    { label: "运费模板", value: product.freightTemplateId || "无需物流" },
    {
      label: "支持金币抵扣",
      value: product.supportCoin
        ? "是（抵扣比例 " + product.coinDiscountRateBps + " 基点）"
        : "否",
    },
    { label: "排序权重", value: String(product.sortOrder) },
    { label: "状态", value: product.status },
    { label: "创建时间", value: product.createdAt },
    { label: "更新时间", value: product.updatedAt },
    {
      label: "商品图片",
      value: imageList.length > 0 ? imageList.join(" | ") : "-",
    },
  ];

  return (
    <div>
      <div className="detail-grid">
        {items.map((item) => (
          <div className="detail-item" key={item.label}>
            <span className="detail-label">{item.label}：</span>
            <span className="detail-value">{item.value}</span>
          </div>
        ))}
      </div>
      {product.details && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px dashed #f0f0f0",
            paddingTop: 12,
          }}
        >
          <Typography.Text strong>商品详情（HTML）：</Typography.Text>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: "#f8fafc",
              borderRadius: 8,
              maxHeight: 260,
              overflow: "auto",
              fontSize: 13,
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(product.details),
            }}
          />
        </div>
      )}
      {imageList.length > 0 && (
        <div
          style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          {imageList.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={"商品图" + (idx + 1)}
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                objectFit: "cover",
                border: "1px solid #f0f0f0",
              }}
            />
          ))}
        </div>
      )}
      {/* SKU 管理区 */}
      {skus.length > 0 && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px dashed #f0f0f0",
            paddingTop: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Typography.Text strong>规格列表（SKU）</Typography.Text>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={onAddSku}
            >
              新增 SKU
            </Button>
          </div>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "#fafafa", textAlign: "left" }}>
                <th
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  SKU 编号
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  规格
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  价格
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  库存
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  条码
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  状态
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {skus.map((sku) => {
                let specDisplay = sku.specValues;
                try {
                  const specs = JSON.parse(sku.specValues) as Array<{
                    key: string;
                    value: string;
                  }>;
                  specDisplay = specs
                    .map((s) => s.key + ":" + s.value)
                    .join(" / ");
                } catch {
                  /* use raw */
                }
                return (
                  <tr key={sku.id}>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      {sku.skuId}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      {specDisplay}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      {formatAmount(sku.price)}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      {sku.stock}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      {sku.barcode}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <Tag color={sku.status === "启用" ? "green" : "default"}>
                        {sku.status}
                      </Tag>
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <Space>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => onEditSku(sku)}
                        >
                          编辑
                        </Button>
                        <Popconfirm
                          title="确认删除？"
                          onConfirm={() => handleDeleteSku(sku.id)}
                        >
                          <Button type="link" size="small" danger>
                            删除
                          </Button>
                        </Popconfirm>
                      </Space>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {skus.length === 0 && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px dashed #f0f0f0",
            paddingTop: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Typography.Text strong>规格列表（SKU）</Typography.Text>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={onAddSku}
            >
              新增 SKU
            </Button>
          </div>
          <Typography.Text type="secondary">暂无 SKU 数据</Typography.Text>
        </div>
      )}
    </div>
  );
}
