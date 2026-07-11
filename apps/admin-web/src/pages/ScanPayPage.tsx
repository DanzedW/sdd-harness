// pages/ScanPayPage.tsx — 线下扫码付（演示页面）

import React, { useState, useCallback } from "react";
import { Card, InputNumber, Button, message, Steps, Result } from "antd";
import type { DeductionResult } from "../services/deduction";
import DeductionPicker from "../components/DeductionPicker";
import { couponService } from "../services/couponService";
import { coinService } from "../services/coinService";
import { calculateDeduction } from "../services/deduction";

const ScanPayPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState<number>(0);
  const [deductionResult, setDeductionResult] = useState<DeductionResult | null>(null);
  const [selection, setSelection] = useState({
    couponId: null as string | null,
    couponDeduction: 0,
    coinUsed: 0,
    coinDeduction: 0,
    finalPay: 0,
  });
  const [payResult, setPayResult] = useState<"success" | "fail" | null>(null);

  const calcDeduction = useCallback(async () => {
    if (amount <= 0) {
      message.warning("请输入有效金额");
      return;
    }
    const coupons = await couponService.getAvailableCoupons("u-1");
    const balance = await coinService.getUserBalance("u-1");
    const result = calculateDeduction(
      { totalAmount: amount, userId: "u-1", shopId: "sh-1" },
      coupons,
      balance
    );
    setDeductionResult(result);
    setStep(2);
  }, [amount]);

  const handlePay = useCallback(() => {
    // Mock 支付（模拟 B扫C）
    setTimeout(() => {
      const success = Math.random() > 0.2;
      setPayResult(success ? "success" : "fail");
      setStep(3);
    }, 1000);
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "24px auto" }}>
      <Steps
        current={step - 1}
        size="small"
        items={[
          { title: "输入金额" },
          { title: "选择优惠" },
          { title: "支付结果" },
        ]}
        style={{ marginBottom: 24 }}
      />

      {step === 1 && (
        <Card title="线下扫码付">
          <p>模拟用户扫商户收款码后输入支付金额</p>
          <InputNumber
            style={{ width: 200 }}
            min={1}
            max={9999999}
            value={amount}
            onChange={(v) => setAmount(v || 0)}
            addonAfter="分"
            placeholder="输入金额（分）"
          />
          <div style={{ color: "#888", marginTop: 4 }}>
            ¥{((amount || 0) / 100).toFixed(2)} 元
          </div>
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            onClick={calcDeduction}
            disabled={amount <= 0}
          >
            查询可用优惠
          </Button>
        </Card>
      )}

      {step === 2 && deductionResult && (
        <Card title="选择优惠方案">
          <DeductionPicker
            totalAmount={amount}
            availableCoupons={deductionResult.availableCoupons}
            recommendedCouponId={deductionResult.recommendedCouponId}
            maxCoinCanUse={deductionResult.maxCoinCanUse}
            onSelectionChange={setSelection}
          />
          <Button
            type="primary"
            size="large"
            block
            style={{ marginTop: 16 }}
            onClick={handlePay}
          >
            确认支付 ¥{(selection.finalPay / 100).toFixed(2)}
          </Button>
        </Card>
      )}

      {step === 3 && (
        <Result
          status={payResult === "success" ? "success" : "error"}
          title={
            payResult === "success"
              ? `支付成功 ¥${(selection.finalPay / 100).toFixed(2)}`
              : "支付失败"
          }
          subTitle={
            payResult === "success"
              ? `挂牌价 ¥${(amount / 100).toFixed(2)} · 券抵扣 ¥${(selection.couponDeduction / 100).toFixed(2)} · 积分 ${selection.coinUsed}`
              : "请重试"
          }
          extra={[
            <Button
              key="retry"
              type="primary"
              onClick={() => {
                setStep(1);
                setPayResult(null);
                setAmount(0);
              }}
            >
              重新扫码
            </Button>,
          ]}
        />
      )}
    </div>
  );
};

export default ScanPayPage;
