import { Button, Form, Space } from "antd";
import type { ReactNode } from "react";

interface InlineFilterBarProps {
  children?: ReactNode;
  filters?: Array<{
    key: string;
    label: ReactNode;
    children: ReactNode;
  }>;
  actions?: ReactNode;
  onSearch?: () => void;
  onReset?: () => void;
}

export function InlineFilterBar({
  children,
  filters,
  actions,
  onSearch,
  onReset,
}: InlineFilterBarProps) {
  return (
    <div className="inline-filter-bar">
      <Form layout="inline" className="inline-filter-form">
        {children}
        {filters?.map((filter) => (
          <Form.Item key={filter.key} label={filter.label}>
            {filter.children}
          </Form.Item>
        ))}
        {onSearch ? (
          <Form.Item>
            <Button type="primary" onClick={onSearch}>
              查询
            </Button>
          </Form.Item>
        ) : null}
        {onReset ? (
          <Form.Item>
            <Button type="primary" ghost onClick={onReset}>
              重置
            </Button>
          </Form.Item>
        ) : null}
      </Form>
      {actions ? <Space wrap className="inline-filter-actions">{actions}</Space> : null}
    </div>
  );
}
