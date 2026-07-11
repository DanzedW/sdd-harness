import { Form, Input, InputNumber, Select, Switch, TreeSelect, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { FormSection } from "../components/backoffice/FormSection";
import { PageActions } from "../components/backoffice/PageActions";
import { adminService } from "../services/adminService";
import type { Category, Merchant, Product } from "../types";
import { ProductTypeOptions } from "../types";

interface ProductEditValues {
  spuId: string;
  spuName: string;
  categoryId: string;
  categoryName: string;
  merchantId: string;
  merchantName: string;
  productType: Product["productType"];
  price: number;
  marketPrice: number;
  stock: number;
  sales: number;
  salesLimit: number;
  supportCoin: boolean;
  coinDiscountRateBps: number;
  freightTemplateId: string;
  sortOrder: number;
  status: Product["status"];
  description: string;
  images: string;
  details: string;
}

function buildCategoryTree(categories: Category[], parentId: string | null): Array<{ title: string; value: string; children?: Array<{ title: string; value: string }> }> {
  return categories
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.sort - b.sort)
    .map((item) => ({
      title: item.name,
      value: item.id,
      children: buildCategoryTree(categories, item.id),
    }));
}

export function ProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = !id;
  const [form] = Form.useForm<ProductEditValues>();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product>();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    void (async () => {
      const [merchantList, categoryList] = await Promise.all([
        adminService.getAllMerchants(),
        adminService.getAllCategories(),
      ]);
      setMerchants(merchantList);
      setCategories(categoryList);

      if (id) {
        const current = await adminService.getProductById(id);
        setProduct(current);
        if (current) {
          form.setFieldsValue(current);
        }
      } else {
        form.setFieldsValue({
          spuId: "SPU-MOCK-" + Date.now(),
          productType: "实物邮寄",
          price: 0,
          marketPrice: 0,
          stock: 0,
          sales: 0,
          salesLimit: 0,
          supportCoin: false,
          coinDiscountRateBps: 0,
          freightTemplateId: "",
          sortOrder: 99,
          status: "草稿",
          images: "[]",
          details: "",
        });
      }
    })();
  }, [form, id]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const category = categories.find((item) => item.id === values.categoryId);
      const merchant = merchants.find((item) => item.id === values.merchantId);
      const next: Product = {
        id: product?.id ?? "MOCK-" + Date.now(),
        updatedAt: product?.updatedAt ?? "刚刚",
        createdAt: product?.createdAt ?? new Date().toISOString().replace("T", " ").slice(0, 19),
        ...product,
        ...values,
        categoryName: values.categoryName || category?.name || "",
        merchantName: values.merchantName || merchant?.name || "",
      };
      await adminService.saveProduct(next);
      message.success(isCreate ? "商品已新增到本地 Mock 数据" : "商品已更新到本地 Mock 数据");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackofficePage
      breadcrumbs={["商品管理", isCreate ? "新增商品" : "编辑商品"]}
      title={isCreate ? "新增商品" : "编辑商品"}
      description="商品主数据使用独立页面维护，适合承载多分组字段、图片和图文内容。"
    >
      <Form form={form} layout="vertical" className="backoffice-edit-form">
        <FormSection title="基本信息">
          <Form.Item label="商品名称" name="spuName" rules={[{ required: true, message: "请输入商品名称" }]}>
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item label="商品编码" name="spuId" rules={[{ required: true, message: "请输入商品编码" }]}>
            <Input placeholder="请输入商品编码" />
          </Form.Item>
          <Form.Item label="分类" name="categoryId" rules={[{ required: true, message: "请选择分类" }]}>
            <TreeSelect treeData={buildCategoryTree(categories, null)} placeholder="请选择分类" treeDefaultExpandAll />
          </Form.Item>
          <Form.Item label="分类名称" name="categoryName">
            <Input placeholder="可自动匹配，也可手动修正" />
          </Form.Item>
          <Form.Item label="所属商户" name="merchantId" rules={[{ required: true, message: "请选择商户" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="请选择商户"
              options={merchants.map((item) => ({ label: item.name, value: item.id }))}
            />
          </Form.Item>
          <Form.Item label="商户名称" name="merchantName">
            <Input placeholder="可自动匹配，也可手动修正" />
          </Form.Item>
          <Form.Item label="商品类型" name="productType" rules={[{ required: true, message: "请选择商品类型" }]}>
            <Select options={ProductTypeOptions.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
        </FormSection>

        <FormSection title="销售配置">
          <Form.Item label="售价（分）" name="price" rules={[{ required: true, message: "请输入售价" }]}>
            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="原价（分）" name="marketPrice">
            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="库存" name="stock" rules={[{ required: true, message: "请输入库存" }]}>
            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="销量" name="sales">
            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="限购数量" name="salesLimit">
            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="支持金币抵扣" name="supportCoin" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Form.Item label="积分抵扣比例（基点）" name="coinDiscountRateBps">
            <InputNumber min={0} max={10000} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="运费模板" name="freightTemplateId">
            <Input placeholder="请输入运费模板编号，无需物流可留空" />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder">
            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="商品状态" name="status" rules={[{ required: true, message: "请选择状态" }]}>
            <Select
              options={["草稿", "待审核", "上架", "下架"].map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>
        </FormSection>

        <FormSection title="正文内容">
          <Form.Item label="商品简介" name="description">
            <Input.TextArea rows={2} placeholder="请输入商品简介" />
          </Form.Item>
          <Form.Item label="商品图片 JSON" name="images">
            <Input.TextArea rows={2} placeholder='["https://example.com/image.png"]' />
          </Form.Item>
          <Form.Item label="商品详情 HTML" name="details">
            <Input.TextArea rows={5} placeholder="<h3>商品详情</h3><p>请输入详情内容</p>" />
          </Form.Item>
        </FormSection>
      </Form>

      <PageActions loading={loading} onSubmit={handleSubmit} onCancel={() => navigate("/products")} />
    </BackofficePage>
  );
}
