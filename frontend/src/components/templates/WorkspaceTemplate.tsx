import { LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Drawer, Layout, Space, Typography } from "antd";
import type { ReactNode } from "react";

export function WorkspaceTemplate({
  title,
  mobile,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  navigation,
  busy,
  onSignOut,
  children,
}: {
  title: string;
  mobile: boolean;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  navigation: ReactNode;
  busy: boolean;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <Layout className="workspace">
      {!mobile && (
        <Layout.Sider theme="light" width={212} className="app-sidebar">
          {navigation}
        </Layout.Sider>
      )}
      <Layout className="workspace-main">
        <Layout.Header className="workspace-header">
          <Space size={12}>
            {mobile && (
              <Button
                icon={<MenuOutlined aria-hidden />}
                type="text"
                aria-label="เปิดเมนู"
                onClick={onOpenMenu}
              />
            )}
            {mobile ? (
              <Typography.Text strong className="mobile-brand">
                inventory.
              </Typography.Text>
            ) : (
              <Breadcrumb items={[{ title: "คลังสินค้า" }, { title }]} />
            )}
          </Space>
          <Button
            icon={<LogoutOutlined aria-hidden />}
            loading={busy}
            onClick={onSignOut}
          >
            ออกจากระบบ
          </Button>
        </Layout.Header>
        <Layout.Content className="workspace-content">{children}</Layout.Content>
      </Layout>
      <Drawer
        title="เมนูหลัก"
        placement="left"
        size={280}
        open={mobile && menuOpen}
        onClose={onCloseMenu}
      >
        {navigation}
      </Drawer>
    </Layout>
  );
}
