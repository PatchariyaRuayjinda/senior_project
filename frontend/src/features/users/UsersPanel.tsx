import { Alert, Empty, Skeleton, Table } from "antd";
import { useEffect, useState } from "react";
import { apiRequest, errorMessage, type User } from "../auth/api/client";
import { roleLabel } from "../auth/labels";

export function UsersPanel() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
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
  }, []);
  return (
    <>
      {error && (
        <Alert className="workspace-error" type="error" showIcon title={error} />
      )}
      <section className="users-section" aria-label="รายชื่อผู้ใช้งาน">
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
    </>
  );
}
