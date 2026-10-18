import { Typography } from "antd";
import type { ReactNode } from "react";

export function PageHeading({
  title,
  description,
  actions,
  className = "",
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`page-heading ${className}`.trim()}>
      <div>
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
      </div>
      {actions}
    </div>
  );
}
