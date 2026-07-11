import { Divider } from "antd";
import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="form-section">
      <Divider orientation="left" orientationMargin={0}>
        {title}
      </Divider>
      {children}
    </div>
  );
}
