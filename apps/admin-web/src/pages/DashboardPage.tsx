import {
  Alert,
  Button,
  Card,
  Col,
  List,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import type { CommerceCase } from "../domain/commerceWorkflow";
import { adminService } from "../services/adminService";
import { commerceWorkflowService } from "../services/commerceWorkflowService";
import { buildWorkflowDashboard } from "./dashboardModel";

interface DashboardData {
  // 用户维度
  totalUsers: number;
  activeUsers: number;
  orderUsers: number;
  coinUsers: number;
  // 商品维度（单位：分）
  totalPayAmount: number;
  totalCoinAmount: number;
  totalCommissionAmount: number;
  totalOrderCount: number;
  // 销售数据（单位：分）
  totalSettleAmount: number;
  salesOrderCount: number;
  totalRefundAmount: number;
  refundProductCount: number;
  totalMerchants: number;
  totalProducts: number;
  onSaleProducts: number;
  // 其他
  pendingMerchants: number;
  trends: Array<{ label: string; value: number }>;
  notices: string[];
}

/** 分转元 */
function yuan(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>();
  const [commerceCases, setCommerceCases] = useState<CommerceCase[]>([]);

  useEffect(() => {
    void adminService.dashboard().then(setData);
    setCommerceCases(commerceWorkflowService.list());
  }, []);

  const workflow = buildWorkflowDashboard(commerceCases);

  return (
    <BackofficePage
      breadcrumbs={["首页", "经营看板"]}
      title="经营看板"
      description="基于本地 Mock 数据汇总运营管理和供应链管理关键指标。"
    >
      <Alert
        showIcon
        type="info"
        message="Mock 模式"
        description="所有数据来自 src/mocks，基于订单、用户、商品、商户 Mock 数据实时计算得出。"
        className="dashboard-alert"
      />

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        今日业务待办
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="闭环待处理" value={workflow.pending} suffix="个" valueStyle={{ color: "#1677ff" }} />
            <Button type="link" style={{ paddingLeft: 0 }} onClick={() => navigate("/commerce-workbench")}>进入电商运营工作台</Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="风险案例" value={workflow.risk} suffix="个" valueStyle={{ color: workflow.risk ? "#cf1322" : undefined }} />
            <Typography.Text type="secondary">履约凭证、退款或对账异常</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="闭环已完成" value={workflow.completed} suffix="个" valueStyle={{ color: "#389e0d" }} />
            <Typography.Text type="secondary">已完成结算并保留审计记录</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        运营管理
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="总用户" value={data?.totalUsers ?? 0} suffix="人" />
            <Typography.Text type="secondary">Mock 用户总数</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="活跃用户" value={data?.activeUsers ?? 0} suffix="人" />
            <Typography.Text type="secondary">状态为「启用」的用户</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="下单用户" value={data?.orderUsers ?? 0} suffix="人" />
            <Typography.Text type="secondary">至少下过 1 单的用户</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="金币用户" value={data?.coinUsers ?? 0} suffix="人" />
            <Typography.Text type="secondary">使用过金币支付的用户</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="待审核商户" value={data?.pendingMerchants ?? 0} suffix="家" />
            <Typography.Text type="secondary">企业认证和开店审核入口</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        供应链管理
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic
              title="订单总金额"
              value={data ? yuan(data.totalPayAmount) : "0.00"}
              prefix="¥"
            />
            <Typography.Text type="secondary">现金实付总额（分转元）</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic
              title="供应链交易金额"
              value={data ? yuan(data.totalPayAmount + data.totalCoinAmount) : "0.00"}
              prefix="¥"
            />
            <Typography.Text type="secondary">现金 + 金币折算总额</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="订单总数" value={data?.totalOrderCount ?? 0} suffix="单" />
            <Typography.Text type="secondary">供应链订单台账总量</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="商户总数" value={data?.totalMerchants ?? 0} suffix="家" />
            <Typography.Text type="secondary">商户与供应商主体</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic
              title="销售金额"
              value={data ? yuan(data.totalSettleAmount) : "0.00"}
              prefix="¥"
            />
            <Typography.Text type="secondary">应结算金额（分转元）</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="商品总数" value={data?.totalProducts ?? 0} suffix="个" />
            <Typography.Text type="secondary">SPU 商品数量</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic
              title="退款金额"
              value={data ? yuan(data.totalRefundAmount) : "0.00"}
              prefix="¥"
              valueStyle={{ color: "#cf1322" }}
            />
            <Typography.Text type="secondary">已退款/退款中的订单</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic
              title="上架商品"
              value={data?.onSaleProducts ?? 0}
              suffix="个"
              valueStyle={{ color: "#389e0d" }}
            />
            <Typography.Text type="secondary">当前可售商品</Typography.Text>
          </Card>
        </Col>
      </Row>

      {/* 业务分布 + 提示 */}
      <Row gutter={[16, 16]} className="dashboard-section" style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <span>订单趋势（按履约类型）</span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  共 {data?.totalOrderCount ?? 0} 单
                </Typography.Text>
              </Space>
            }
          >
            <List
              dataSource={data?.trends ?? []}
              renderItem={(item) => {
                const total = data?.totalOrderCount ?? 1;
                const pct = ((item.value / total) * 100).toFixed(1);
                return (
                  <List.Item>
                    <span>{item.label}</span>
                    <Space>
                      <strong>{item.value} 单</strong>
                      <Typography.Text type="secondary">({pct}%)</Typography.Text>
                    </Space>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="运行提示">
            <List
              dataSource={data?.notices ?? []}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>
        </Col>
      </Row>

    </BackofficePage>
  );
}
