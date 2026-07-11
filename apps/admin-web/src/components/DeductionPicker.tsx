// components/DeductionPicker.tsx — 抵扣选择器（线上商城支付 + 线下扫码付共用）

import React, { useState, useMemo, useEffect } from "react";
import { Card, Radio, InputNumber, Descriptions, Space, Typography } from "antd";

const { Text, Title } = Typography;

export interface PickerProps {
  totalAmount: number;       // 挂牌价（分）
  availableCoupons: Array<{
    couponId: string;
    templateName: string;
    deductionAmount: number;
  }>;
  recommendedCouponId: string | null;
  maxCoinCanUse: number;
  onSelectionChange: (selection: {
    couponId: string | null;
    couponDeduction: number;
    coinUsed: number;
    coinDeduction: number;
    finalPay: number;
  }) => void;
}

const DeductionPicker: React.FC<PickerProps> = ({
  totalAmount,
  availableCoupons,
  recommendedCouponId,
  maxCoinCanUse,
  onSelectionChange,
}) => {
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(
    recommendedCouponId
  );
  const [coinUsed, setCoinUsed] = useState(0);

  const selectedCoupon = useMemo(
    () => availableCoupons.find((c) => c.couponId === selectedCouponId),
    [selectedCouponId, availableCoupons]
  );

  const couponDeduction = selectedCoupon?.deductionAmount ?? 0;
  const afterCoupon = totalAmount - couponDeduction;
  const coinDeduction = Math.min(coinUsed, afterCoupon);
  const finalPay = afterCoupon - coinDeduction;

  useEffect(() => {
    onSelectionChange({
      couponId: selectedCouponId,
      couponDeduction,
      coinUsed,
      coinDeduction,
      finalPay,
    });
  }, [selectedCouponId, coinUsed, couponDeduction, coinDeduction, finalPay, onSelectionChange]);

  return (
    <Card size="small" title="优惠抵扣">
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* 消费券选择 */}
        {availableCoupons.length > 0 && (
          <div>
            <Text strong>消费券</Text>
            <Radio.Group
              style={{ marginLeft: 12 }}
              value={selectedCouponId}
              onChange={(e) => setSelectedCouponId(e.target.value)}
            >
              <Radio.Button value={"" as any}>不使用</Radio.Button>
              {availableCoupons.map((c) => (
                <Radio.Button key={c.couponId} value={c.couponId}>
                  {c.templateName}（-¥{(c.deductionAmount / 100).toFixed(2)}）
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        )}

        {/* 积分抵扣 */}
        {maxCoinCanUse > 0 && (
          <div>
            <Text strong>积分抵扣</Text>
            <span style={{ marginLeft: 12, color: "#888" }}>
              （最多可用 {maxCoinCanUse} 积分，1积分=1分）
            </span>
            <InputNumber
              style={{ width: 120, marginLeft: 8 }}
              min={0}
              max={maxCoinCanUse}
              value={coinUsed}
              onChange={(v) => setCoinUsed(v || 0)}
              addonAfter="分"
            />
          </div>
        )}

        {/* 汇总 */}
        <Card size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="挂牌价">
              ¥{(totalAmount / 100).toFixed(2)}
            </Descriptions.Item>
            {couponDeduction > 0 && (
              <Descriptions.Item label="券抵扣">
                <Text type="success">-¥{(couponDeduction / 100).toFixed(2)}</Text>
              </Descriptions.Item>
            )}
            {coinDeduction > 0 && (
              <Descriptions.Item label="积分抵扣">
                <Text type="success">-{coinUsed}积分（¥{(coinDeduction / 100).toFixed(2)}）</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="实际应付">
              <Title level={5} type="danger" style={{ margin: 0 }}>
                ¥{(finalPay / 100).toFixed(2)}
              </Title>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    </Card>
  );
};

export default DeductionPicker;
