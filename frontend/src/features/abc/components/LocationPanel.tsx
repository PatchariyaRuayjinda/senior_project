import {
  Alert,
  App,
  Button,
  Checkbox,
  Divider,
  Form,
  Select,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import {
  availableSlots,
  confirmRelocation,
  needsRelocation,
  prepareRelocation,
  type AnalysisRow,
  type DateRange,
  type DemoInventory,
  type Relocation,
} from "../model";

import { AbcTag } from "../../../components/atoms/AbcTag";
import { rangeLabel } from "../format";

const { Text, Title, Paragraph } = Typography;

export function LocationPanel({
  row,
  pending,
  range,
  inventory,
  onChange,
}: {
  row: AnalysisRow;
  pending?: Relocation;
  range: DateRange;
  inventory: DemoInventory;
  onChange: (next: DemoInventory) => void;
}) {
  const { message } = App.useApp();
  const [destination, setDestination] = useState<string>();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const available = row.classification
    ? availableSlots(inventory, row.classification)
    : [];
  const needsMove = needsRelocation(row);
  const classification = pending?.classification ?? row.classification;
  function prepare() {
    if (!destination) return;
    try {
      onChange(prepareRelocation(inventory, row, destination, range));
      void message.success("เตรียมรายการย้ายตัวอย่างแล้ว ตำแหน่งยังไม่เปลี่ยน");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "เตรียมรายการไม่สำเร็จ กรุณาลองใหม่",
      );
    }
  }
  function confirm() {
    if (!pending || !confirmed) return;
    try {
      onChange(confirmRelocation(inventory, pending.id));
      void message.success(
        `ย้าย ${row.name} จาก ${pending.source} ไป ${pending.destination} แล้ว (ข้อมูลตัวอย่าง)`,
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "ยืนยันไม่สำเร็จ กรุณาลองใหม่",
      );
    }
  }
  return (
    <div className="location-panel-inner">
      <div className="desktop-panel-heading">
        <Title level={2}>{pending ? "รอยืนยันการย้าย" : "เลือกช่องจัดเก็บ"}</Title>
        <Divider />
      </div>
      <Title level={3}>{row.name}</Title>
      <Text type="secondary">
        {row.id} · คงเหลือ {row.quantity} {row.unit}
      </Text>
      <div className="product-analysis">
        <AbcTag classification={classification} />
        <Text>
          เบิก {row.frequency} ครั้ง · สะสม{" "}
          {row.cumulative === null ? "—" : `${Number(row.cumulative.toFixed(1))}%`}
        </Text>
      </div>
      <Divider />
      <div className="location-value">
        <Text type="secondary">ช่องปัจจุบัน</Text>
        <Title level={2}>{row.location}</Title>
      </div>
      {error && (
        <Alert type="error" showIcon title={error} className="panel-error" />
      )}
      {pending ? (
        <>
          <div className="location-value destination-value">
            <Text type="secondary">ช่องปลายทาง · โซน {pending.classification}</Text>
            <div className="destination-row">
              <Title level={2}>{pending.destination}</Title>
              <Tag className="status-pending">กันช่องไว้แล้ว</Tag>
            </div>
          </div>
          <Alert
            type="warning"
            title="ย้ายของจริงก่อนยืนยัน"
            description={`ตำแหน่งในระบบยังเป็น ${pending.source} จนกว่าจะยืนยันรายการสำเร็จ`}
          />
          <div className="confirmation-check">
            <Checkbox
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            >
              ย้ายสินค้าไป {pending.destination} ครบ {pending.quantity} {row.unit}{" "}
              แล้ว
            </Checkbox>
          </div>
          <Text type="secondary" className="pending-reference">
            {pending.id} · ผลวิเคราะห์ {rangeLabel(pending.range)}
          </Text>
          <Text type="secondary" className="reservation-note">
            การกันช่องในชุดทดลองนี้เป็นข้อเสนอ UX
          </Text>
          <div className="panel-actions">
            <Button type="primary" block disabled={!confirmed} onClick={confirm}>
              ยืนยันการย้ายสินค้า
            </Button>
            <Button
              block
              disabled={confirmed}
              onClick={() => {
                onChange({
                  ...inventory,
                  pending: inventory.pending.filter(
                    (move) => move.id !== pending.id,
                  ),
                });
                void message.info("ยกเลิกรายการย้ายตัวอย่างแล้ว");
              }}
            >
              ยกเลิกรายการย้าย
            </Button>
            <Text type="secondary">ยกเลิกได้หากยังไม่ได้ย้ายของจริง</Text>
          </div>
        </>
      ) : needsMove && row.classification ? (
        <Form layout="vertical" onFinish={prepare} className="location-form">
          <Form.Item
            label={`ช่องปลายทาง · โซน ${row.classification}`}
            htmlFor="destination-slot"
            required
          >
            <Select
              virtual={false}
              id="destination-slot"
              aria-label="ช่องปลายทาง"
              value={destination}
              placeholder="เลือกช่องว่าง"
              allowClear
              onChange={(value) => {
                setDestination(value);
                setError("");
              }}
              notFoundContent="ไม่มีช่องว่างในโซนนี้"
              options={available.map((slot) => ({
                value: slot,
                label: `${slot} · โซน ${row.classification} · ว่าง`,
              }))}
            />
          </Form.Item>
          {available.length ? (
            <>
              <Text type="secondary">ช่องว่างในโซน {row.classification}</Text>
              <div className="available-slots">
                {available.map((slot) => (
                  <Tag className="status-neutral" key={slot}>
                    {slot}
                  </Tag>
                ))}
              </div>
              <Paragraph type="secondary" className="location-help">
                ระบบเสนอเฉพาะช่องว่างที่ตรงโซน
                <br />
                ตรวจพื้นที่จริงก่อนเตรียมรายการย้าย
              </Paragraph>
            </>
          ) : (
            <Alert
              type="warning"
              showIcon
              title="ไม่มีช่องว่างในโซนนี้"
              description="ลองยกเลิกรายการย้ายที่ยังไม่ได้ทำจริงเพื่อคืนช่อง หรือจัดพื้นที่ก่อนเตรียมใหม่"
            />
          )}
          <div className="panel-actions">
            <Button
              type="primary"
              htmlType="submit"
              block
              disabled={!destination || !available.includes(destination)}
            >
              เตรียมรายการย้าย
            </Button>
            <Text type="secondary">ยังไม่เปลี่ยนตำแหน่งสินค้าในขั้นนี้</Text>
          </div>
        </Form>
      ) : (
        <Alert
          type="info"
          showIcon
          title={
            row.classification
              ? "สินค้าอยู่ในโซนที่แนะนำแล้ว"
              : "ยังไม่มีประวัติการเบิก"
          }
          description={
            row.classification
              ? "เลือกสินค้าอื่นจากตารางเพื่อจัดตำแหน่งต่อได้"
              : "ระบบยังไม่จัดกลุ่ม ABC และไม่เสนอให้ย้ายอัตโนมัติ"
          }
        />
      )}
    </div>
  );
}
