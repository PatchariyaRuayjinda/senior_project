import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Breadcrumb,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Grid,
  Layout,
  Menu,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  type MenuProps,
} from "antd";
import {
  BarChartOutlined,
  LogoutOutlined,
  MenuOutlined,
  TeamOutlined,
  UserOutlined,
  DatabaseOutlined,
  TagsOutlined,
  EnvironmentOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { apiRequest, errorMessage, logout, type User } from "../auth/client";
import { AbcWorkbench } from "../inventory/AbcWorkbench";
import { createDemoInventory } from "../inventory/model";
import {
  MasterDataPage,
  masterDataTitles,
  type MasterDataView,
} from "../master-data/MasterDataPage";

const roleLabel = (role: User["role"]) =>
  role === "admin" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่คลัง";
type Page = "abc" | "account" | "users" | MasterDataView;
const pageTitles: Record<Page, string> = {
  abc: "วิเคราะห์ ABC",
  account: "บัญชีของฉัน",
  users: "ผู้ใช้งาน",
  ...masterDataTitles,
};
export function Workspace({ user }: { user: User }) {
  const [page, setPage] = useState<Page>("abc");
  const [inventory, setInventory] = useState(createDemoInventory);
  const [menuOpen, setMenuOpen] = useState(false);
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const screens = Grid.useBreakpoint();
  const mobile = !screens.lg;
  const title = pageTitles[page];
  const items: MenuProps["items"] = [
    {
      key: "products",
      label: masterDataTitles.products,
      icon: <DatabaseOutlined aria-hidden />,
    },
    {
      key: "lots",
      label: masterDataTitles.lots,
      icon: <TagsOutlined aria-hidden />,
    },
    {
      key: "locations",
      label: masterDataTitles.locations,
      icon: <EnvironmentOutlined aria-hidden />,
    },
    {
      key: "pallets",
      label: masterDataTitles.pallets,
      icon: <InboxOutlined aria-hidden />,
    },
    {
      key: "abc",
      label: "วิเคราะห์ ABC",
      icon: <BarChartOutlined aria-hidden />,
    },
    {
      key: "account",
      label: "บัญชีของฉัน",
      icon: <UserOutlined aria-hidden />,
    },
    ...(user.role === "admin"
      ? [
          {
            key: "users",
            label: "ผู้ใช้งาน",
            icon: <TeamOutlined aria-hidden />,
          },
        ]
      : []),
  ];
  useEffect(() => {
    if (page !== "users") return;
    let active = true;
    setError("");
    setUsers(null);
    apiRequest<{ users: User[] }>("/api/admin/users")
      .then((result) => {
        if (active) setUsers(result.users);
      })
      .catch((failure) => {
        if (active) setError(errorMessage(failure));
      });
    return () => {
      active = false;
    };
  }, [page]);
  useEffect(() => {
    document.title = `Inventory · ${title}`;
  }, [title]);
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  function navigate(key: string) {
    if (
      key === "abc" ||
      key === "account" ||
      key === "products" ||
      key === "lots" ||
      key === "locations" ||
      key === "pallets" ||
      (key === "users" && user.role === "admin")
    ) {
      setPage(key);
      setError("");
      setMenuOpen(false);
    }
  }
  const navigation = (
    <div className="navigation-content">
      <Button className="brand" type="text" onClick={() => navigate("abc")}>
        inventory.
      </Button>
      <nav aria-label="เมนูหลัก">
        <Menu
          mode="inline"
          selectedKeys={[page]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </nav>
      <div className="sidebar-account">
        <Avatar icon={<UserOutlined aria-hidden />} />
        <div>
          <Typography.Text strong>{user.username}</Typography.Text>
          <Typography.Text type="secondary">
            {roleLabel(user.role)}
          </Typography.Text>
        </div>
      </div>
    </div>
  );
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
                onClick={() => setMenuOpen(true)}
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
            onClick={signOut}
          >
            ออกจากระบบ
          </Button>
        </Layout.Header>
        <Layout.Content className="workspace-content">
          {error && (
            <Alert
              className="workspace-error"
              type="error"
              showIcon
              title={error}
            />
          )}
          {page === "products" ||
          page === "lots" ||
          page === "locations" ||
          page === "pallets" ? (
            <MasterDataPage key={page} view={page} user={user} />
          ) : page === "abc" ? (
            <AbcWorkbench inventory={inventory} onChange={setInventory} />
          ) : (
            <>
              <div className="page-heading">
                <Typography.Title level={1}>
                  {page === "account"
                    ? `สวัสดี, ${user.username}`
                    : "ผู้ใช้งาน"}
                </Typography.Title>
                <Typography.Paragraph type="secondary">
                  {page === "account"
                    ? "ยินดีต้อนรับสู่พื้นที่ทำงานของคุณ"
                    : "บัญชีผู้ใช้และสิทธิ์การใช้งานในระบบ"}
                </Typography.Paragraph>
              </div>
              {page === "account" ? (
                <section className="account-section" aria-label="ข้อมูลบัญชี">
                  <Space className="account-title">
                    <Typography.Title level={2}>ข้อมูลบัญชี</Typography.Title>
                    <Tag className="status-aligned">เข้าสู่ระบบแล้ว</Tag>
                  </Space>
                  <Descriptions
                    column={1}
                    items={[
                      {
                        key: "username",
                        label: "ชื่อผู้ใช้",
                        children: user.username,
                      },
                      {
                        key: "role",
                        label: "สิทธิ์การใช้งาน",
                        children: roleLabel(user.role),
                      },
                    ]}
                  />
                </section>
              ) : (
                <section
                  className="users-section"
                  aria-label="รายชื่อผู้ใช้งาน"
                >
                  {!users && !error ? (
                    <Skeleton active title={false} paragraph={{ rows: 4 }} />
                  ) : users ? (
                    <Table<User>
                      rowKey="id"
                      dataSource={users}
                      pagination={false}
                      columns={[
                        { title: "ชื่อผู้ใช้", dataIndex: "username" },
                        {
                          title: "สิทธิ์การใช้งาน",
                          dataIndex: "role",
                          render: (role) => roleLabel(role),
                        },
                      ]}
                    />
                  ) : (
                    <Empty description="โหลดผู้ใช้งานไม่สำเร็จ ลองเปิดหน้านี้อีกครั้ง" />
                  )}
                </section>
              )}
            </>
          )}
        </Layout.Content>
      </Layout>
      <Drawer
        title="เมนูหลัก"
        placement="left"
        size={280}
        open={mobile && menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        {navigation}
      </Drawer>
    </Layout>
  );
}
