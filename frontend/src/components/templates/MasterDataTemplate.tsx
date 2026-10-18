import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Button } from "antd";
import type { ReactNode } from "react";
import { PageHeading } from "../molecules/PageHeading";

export function MasterDataTemplate({
  title,
  description,
  error,
  loading,
  reload,
  children,
}: {
  title: string;
  description: string;
  error: string;
  loading: boolean;
  reload: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeading
        title={title}
        description={description}
        className="master-data-heading"
        actions={
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => void reload()}
          >
            โหลดข้อมูลใหม่
          </Button>
        }
      />
      {error && (
        <Alert
          className="master-data-feedback"
          type="error"
          showIcon
          title={error}
          action={<Button onClick={() => void reload()}>ลองใหม่</Button>}
        />
      )}
      <section className="master-data-section" aria-label={title}>
        {children}
      </section>
    </>
  );
}
