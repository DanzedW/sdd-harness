import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../services/adminService";

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <main className="login-page">
      <Card className="login-card">
        <Typography.Title level={2}>数字生活管理后台</Typography.Title>
        <Typography.Paragraph type="secondary">前端 Mock 演示版，任意账号密码均可登录。</Typography.Paragraph>
        <Form
          layout="vertical"
          initialValues={{ account: "admin", password: "mock123456" }}
          onFinish={async (values: { account: string; password: string }) => {
            setLoading(true);
            try {
              const result = await adminService.login(values.account, values.password);
              localStorage.setItem("admin-token", result.token);
              message.success("登录成功，已进入 Mock 后台");
              navigate("/dashboard");
            } catch {
              message.error("登录失败，请检查账号密码后重试");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Form.Item name="account" label="账号" rules={[{ required: true, message: "请输入账号" }]}>
            <Input prefix={<UserOutlined />} placeholder="admin" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="mock123456" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
        </Form>
      </Card>
    </main>
  );
}
