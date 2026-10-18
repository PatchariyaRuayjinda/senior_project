import {
  BarChartOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, Grid, type MenuProps } from "antd";
import { useEffect, useState } from "react";
import { PageHeading } from "../components/molecules/PageHeading";
import { WorkspaceNavigation } from "../components/organisms/WorkspaceNavigation";
import { WorkspaceTemplate } from "../components/templates/WorkspaceTemplate";
import { AbcWorkbench } from "../features/abc/AbcWorkbench";
import { createDemoInventory } from "../features/abc/model";
import { errorMessage, logout, type User } from "../features/auth/api/client";
import { AccountPanel } from "../features/auth/components/AccountPanel";
import { roleLabel } from "../features/auth/labels";
import { UsersPanel } from "../features/users/UsersPanel";
import {
  MasterDataPage,
  masterDataTitles,
  type MasterDataView,
} from "./master-data/MasterDataPage";

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
  return (
    <WorkspaceTemplate
      title={title}
      mobile={mobile}
      menuOpen={menuOpen}
      onOpenMenu={() => setMenuOpen(true)}
      onCloseMenu={() => setMenuOpen(false)}
      busy={busy}
      onSignOut={signOut}
      navigation={
        <WorkspaceNavigation
          username={user.username}
          role={roleLabel(user.role)}
          selectedKey={page}
          items={items}
          onHome={() => navigate("abc")}
          onNavigate={navigate}
        />
      }
    >
      {error && (
        <Alert className="workspace-error" type="error" showIcon title={error} />
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
          <PageHeading
            title={page === "account" ? `สวัสดี, ${user.username}` : "ผู้ใช้งาน"}
            description={
              page === "account"
                ? "ยินดีต้อนรับสู่พื้นที่ทำงานของคุณ"
                : "บัญชีผู้ใช้และสิทธิ์การใช้งานในระบบ"
            }
          />
          {page === "account" ? <AccountPanel user={user} /> : <UsersPanel />}
        </>
      )}
    </WorkspaceTemplate>
  );
}
