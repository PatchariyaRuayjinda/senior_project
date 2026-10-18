import { UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Menu, Typography, type MenuProps } from "antd";

export function WorkspaceNavigation({
  username,
  role,
  selectedKey,
  items,
  onHome,
  onNavigate,
}: {
  username: string;
  role: string;
  selectedKey: string;
  items: MenuProps["items"];
  onHome: () => void;
  onNavigate: (key: string) => void;
}) {
  return (
    <div className="navigation-content">
      <Button className="brand" type="text" onClick={() => onHome()}>
        inventory.
      </Button>
      <nav aria-label="เมนูหลัก">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={({ key }) => onNavigate(key)}
        />
      </nav>
      <div className="sidebar-account">
        <Avatar icon={<UserOutlined aria-hidden />} />
        <div>
          <Typography.Text strong>{username}</Typography.Text>
          <Typography.Text type="secondary">{role}</Typography.Text>
        </div>
      </div>
    </div>
  );
}
