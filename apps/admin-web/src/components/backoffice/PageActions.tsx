import { Button, Space } from "antd";

interface PageActionsProps {
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PageActions({
  submitText = "提交",
  cancelText = "返回",
  loading,
  onSubmit,
  onCancel,
}: PageActionsProps) {
  return (
    <div className="page-actions">
      <Space>
        <Button type="primary" loading={loading} onClick={onSubmit}>
          {submitText}
        </Button>
        <Button type="primary" ghost onClick={onCancel}>
          {cancelText}
        </Button>
      </Space>
    </div>
  );
}
