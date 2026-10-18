import { App, Button } from "antd";
import { useState } from "react";
import type { User } from "../../features/auth/api/client";
import { HistoryDrawer } from "../../features/master-data/components/HistoryDrawer";
import type { Location } from "../../features/master-data/types";

import { SearchToolbar } from "../../components/molecules/SearchToolbar";
import { LocationEditor } from "../../features/master-data/components/LocationEditor";
import { LocationTable } from "../../features/master-data/components/LocationTable";

export function LocationsPage({
  locations,
  user,
  loading,
  reload,
}: {
  locations: Location[];
  user: User;
  loading: boolean;
  reload: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ location: Location | null } | null>(null);
  const [history, setHistory] = useState<Location | null>(null);
  const { message } = App.useApp();
  const canManage = user.role === "admin";
  const visible = locations.filter((location) =>
    `${location.code} ${location.zone} ${location.palletCode ?? ""}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const location = editor?.location ?? null;
  return (
    <>
      <SearchToolbar
        label="ค้นหาช่องเก็บ"
        placeholder="ค้นหารหัสช่อง โซน หรือพาเลต"
        query={query}
        onQueryChange={setQuery}
      >
        {canManage && (
          <Button
            type="primary"
            disabled={loading}
            onClick={() => setEditor({ location: null })}
          >
            เพิ่มช่องเก็บ
          </Button>
        )}
      </SearchToolbar>
      <LocationTable
        locations={visible}
        loading={loading}
        canManage={canManage}
        onEdit={(item) => setEditor({ location: item })}
        onHistory={setHistory}
      />
      {editor && (
        <LocationEditor
          location={location}
          onCancel={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            void message.success("บันทึกช่องเก็บแล้ว");
            void reload();
          }}
        />
      )}
      {history && (
        <HistoryDrawer
          entityType="location"
          id={history.id}
          title={history.code}
          onClose={() => setHistory(null)}
        />
      )}
    </>
  );
}
