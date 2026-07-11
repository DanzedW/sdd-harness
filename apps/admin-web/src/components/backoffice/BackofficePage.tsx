import { Breadcrumb, Space, Typography } from "antd";
import type { ReactNode } from "react";

interface BackofficePageProps {
  breadcrumbs: string[];
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function BackofficePage({
  breadcrumbs,
  title,
  description,
  actions,
  children,
}: BackofficePageProps) {
  return (
    <section className="backoffice-page">
      <Breadcrumb
        className="backoffice-breadcrumb"
        items={breadcrumbs.map((item) => ({ title: item }))}
      />
      <div className="backoffice-heading">
        <div>
          <Typography.Title level={3}>{title}</Typography.Title>
          {description ? (
            <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
          ) : null}
        </div>
        {actions ? <Space wrap>{actions}</Space> : null}
      </div>
      {children}
    </section>
  );
}
