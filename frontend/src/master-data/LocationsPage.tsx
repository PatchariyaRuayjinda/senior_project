import { useState } from "react";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from "antd";
import type { User } from "../auth/client";
import { saveLocation, type LocationChanges } from "./client";
import { EditorModal } from "./EditorModal";
import { HistoryDrawer } from "./HistoryDrawer";
import type { Location, LocationKind } from "./types";

const kindLabels: Record<LocationKind, string> = {
  picking: "พื้นที่หยิบ",
  reserve: "พื้นที่สำรอง",
  temporary: "ช่องพัก",
};
const defaults: LocationChanges = {
  code: "",
  kind: "picking",
  zone: "A",
  active: true,
  inboundBlocked: false,
  outboundBlocked: false,
};

function LocationFields({ location }: { location: Location | null }) {
  const form = Form.useFormInstance<LocationChanges>();
  const kind =
    Form.useWatch<LocationKind>("kind", form) ?? location?.kind ?? "picking";
  const code = Form.useWatch<string>("code", form);
  const inboundBlocked =
    Form.useWatch<boolean>("inboundBlocked", form) ??
    location?.inboundBlocked ??
    false;
  const outboundBlocked =
    Form.useWatch<boolean>("outboundBlocked", form) ??
    location?.outboundBlocked ??
    false;
  const occupied = !!(location?.palletCode || location?.reservedBy);
  const fixed = location?.id === "TMP01";
  const metadataLocked = occupied || fixed;
  const blocksChanged =
    !!location &&
    (inboundBlocked !== location.inboundBlocked ||
      outboundBlocked !== location.outboundBlocked);
  const codeChanged =
    !!location && code?.trim().toUpperCase() !== location.code;
  const zones =
    kind === "picking" ? ["A", "B", "C"] : kind === "reserve" ? ["R"] : ["TMP"];

  return (
    <>
      {metadataLocked && (
        <Alert
          className="master-data-feedback"
          type="info"
          showIcon
          title={
            fixed
              ? "TMP01 เป็นช่องพักเฉพาะ แก้รหัส ประเภท หรือปิดใช้งานไม่ได้"
              : "ช่องมีพาเลตหรืองานจองอยู่ แก้ข้อมูลหรือปิดใช้งานไม่ได้ แต่ระงับรับเข้า/นำออกได้"
          }
        />
      )}
      <div className="master-data-form-grid">
        <Form.Item
          name="code"
          label="รหัสช่องเก็บ"
          rules={[
            { required: true, whitespace: true, message: "กรุณาระบุรหัสช่อง" },
          ]}
        >
          <Input maxLength={64} disabled={metadataLocked} />
        </Form.Item>
        <Form.Item
          name="kind"
          label="ประเภทพื้นที่"
          rules={[{ required: true }]}
        >
          <Select
            disabled={metadataLocked}
            onChange={(value: LocationKind) =>
              form.setFieldValue("zone", value === "reserve" ? "R" : "A")
            }
            options={Object.entries(kindLabels)
              .filter(([value]) => value !== "temporary" || fixed)
              .map(([value, label]) => ({ value, label }))}
          />
        </Form.Item>
        <Form.Item name="zone" label="โซน" rules={[{ required: true }]}>
          <Select
            disabled={metadataLocked}
            options={zones.map((value) => ({ value, label: value }))}
          />
        </Form.Item>
        {location && (
          <Form.Item
            name="active"
            label="เปิดใช้งานช่อง"
            valuePropName="checked"
          >
            <Switch disabled={metadataLocked} />
          </Form.Item>
        )}
        {location && (
          <Form.Item
            name="inboundBlocked"
            label="ระงับรับเข้า"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}
        {location && (
          <Form.Item
            name="outboundBlocked"
            label="ระงับนำออก"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}
      </div>
      {location && (
        <Form.Item
          name="reason"
          label="เหตุผลการเปลี่ยนแปลง"
          rules={[
            {
              required: blocksChanged,
              whitespace: true,
              message: "กรุณาระบุเหตุผลเมื่อระงับหรือปลดระงับ",
            },
          ]}
        >
          <Input.TextArea maxLength={1000} rows={3} />
        </Form.Item>
      )}
      {codeChanged && (
        <Form.Item
          name="labelConfirmed"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error("ต้องปรับป้ายช่องจริงให้ตรงก่อนใช้งาน"),
                    ),
            },
          ]}
        >
          <Checkbox>ปรับป้ายช่องจริงให้ตรงกับรหัสใหม่แล้ว</Checkbox>
        </Form.Item>
      )}
    </>
  );
}

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
  const [editor, setEditor] = useState<{ location: Location | null } | null>(
    null,
  );
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
      <div className="master-data-toolbar">
        <Input.Search
          aria-label="ค้นหาช่องเก็บ"
          placeholder="ค้นหารหัสช่อง โซน หรือพาเลต"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          allowClear
        />
        {canManage && (
          <Button
            type="primary"
            disabled={loading}
            onClick={() => setEditor({ location: null })}
          >
            เพิ่มช่องเก็บ
          </Button>
        )}
      </div>
      <Table<Location>
        rowKey="id"
        loading={loading}
        dataSource={visible}
        scroll={{ x: 950 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: "ไม่พบช่องเก็บที่ตรงกับการค้นหา" }}
        columns={[
          { title: "รหัสช่อง", dataIndex: "code", width: 130 },
          {
            title: "ประเภท",
            dataIndex: "kind",
            render: (kind: LocationKind) => kindLabels[kind],
            width: 145,
          },
          { title: "โซน", dataIndex: "zone", width: 80 },
          {
            title: "พาเลต / งานจอง",
            render: (_, item) =>
              item.palletCode ||
              (item.reservedBy ? `จองโดย ${item.reservedBy}` : "ว่าง"),
            width: 190,
          },
          {
            title: "สถานะ",
            render: (_, item) => (
              <Space wrap>
                {!item.active && <Tag>ปิดใช้งาน</Tag>}
                {item.inboundBlocked && <Tag color="orange">ระงับรับเข้า</Tag>}
                {item.outboundBlocked && <Tag color="orange">ระงับนำออก</Tag>}
                {item.active &&
                  !item.inboundBlocked &&
                  !item.outboundBlocked && <Tag>เปิดใช้งาน</Tag>}
              </Space>
            ),
          },
          {
            title: "จัดการ",
            width: 155,
            render: (_, item) => (
              <Space>
                {canManage && (
                  <Button
                    type="link"
                    aria-label={`แก้ไข ${item.code}`}
                    onClick={() => setEditor({ location: item })}
                  >
                    แก้ไข
                  </Button>
                )}
                <Button
                  type="link"
                  aria-label={`ประวัติ ${item.code}`}
                  onClick={() => setHistory(item)}
                >
                  ประวัติ
                </Button>
              </Space>
            ),
          },
        ]}
      />
      {editor && (
        <EditorModal<LocationChanges>
          key={location?.id ?? "new"}
          title={location ? `แก้ไขช่อง · ${location.code}` : "เพิ่มช่องเก็บ"}
          initialValues={
            location
              ? {
                  code: location.code,
                  kind: location.kind,
                  zone: location.zone,
                  active: location.active,
                  inboundBlocked: location.inboundBlocked,
                  outboundBlocked: location.outboundBlocked,
                  reason: "",
                  labelConfirmed: false,
                }
              : defaults
          }
          onSave={(values, key) => saveLocation(values, location, key)}
          onCancel={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            void message.success("บันทึกช่องเก็บแล้ว");
            void reload();
          }}
        >
          <LocationFields location={location} />
        </EditorModal>
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
