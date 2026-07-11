import {
  Alert,
  Card,
  Col,
  Collapse,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { adminService } from "../services/adminService";

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

const workflowSupervisionItems = [
  {
    role: "Hermes 主导",
    responsibility: "压缩需求、声明安全边界、生成 handoff 与最终复盘",
    evidence: "已形成 .hermes-plans 与三 Agent 路由规则；当前非交互调用仍需复测",
    status: "待验证",
    color: "orange",
  },
  {
    role: "Codex 主攻",
    responsibility: "执行前端优化、检查 diff、运行 typecheck/build 与交付报告",
    evidence: "本轮由 Codex 监督链路并推进 Dashboard 监督卡片优化",
    status: "进行中",
    color: "blue",
  },
  {
    role: "Claude Code 审查",
    responsibility: "辅助方案判断、复杂任务全程 review、输出独立验收意见",
    evidence: "已有 Claude 侧 .hermes-plans 审查材料；正式 CLI 调用证据待补齐",
    status: "待验证",
    color: "purple",
  },
  {
    role: "硬编码 Gate",
    responsibility: "只做校验、拦截和报告，不替代 LLM 推理",
    evidence: "quality-gate.sh 0 已覆盖目录、AGENTS、计划目录与敏感信息检查",
    status: "已完成",
    color: "green",
  },
] as const;

export function DashboardPage() {
  const [data, setData] = useState<DashboardData>();

  useEffect(() => {
    void adminService.dashboard().then(setData);
  }, []);

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

      <Collapse
        style={{ marginTop: 24 }}
        items={[
          {
            key: "workflow",
            label: "AI 工作流监督",
            children: (
              <>
                <Typography.Paragraph type="secondary">
                  本项目采用「LLM 负责拆解、生成、审查；硬编码 Gate 负责校验、拦截、报告」的分工。
                </Typography.Paragraph>
                <Row gutter={[12, 12]}>
                  {workflowSupervisionItems.map((item) => (
                    <Col xs={24} lg={12} xl={6} key={item.role}>
                      <div className="workflow-supervision-item">
                        <Space direction="vertical" size={8}>
                          <Space>
                            <Typography.Text strong>{item.role}</Typography.Text>
                            <Tag color={item.color}>{item.status}</Tag>
                          </Space>
                          <Typography.Text>{item.responsibility}</Typography.Text>
                          <Typography.Text type="secondary">{item.evidence}</Typography.Text>
                        </Space>
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            ),
          },
        ]}
      />
    </BackofficePage>
  );
}
