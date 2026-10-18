import { Alert, Checkbox, Form, Input, Select, Switch } from "antd";
import { type LocationChanges } from "../api/client";
import type { Location, LocationKind } from "../types";

import { kindLabels } from "../locationLabels";

export function LocationFields({ location }: { location: Location | null }) {
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
  const codeChanged = !!location && code?.trim().toUpperCase() !== location.code;
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
        <Form.Item name="kind" label="ประเภทพื้นที่" rules={[{ required: true }]}>
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
          <Form.Item name="active" label="เปิดใช้งานช่อง" valuePropName="checked">
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
