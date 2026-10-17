import { useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Drawer,
  Empty,
  Form,
  Grid,
  Popover,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import {
  analyzeDemo,
  availableSlots,
  confirmRelocation,
  needsRelocation,
  prepareRelocation,
  sampleRange,
  sampleWithdrawals,
  type AbcClass,
  type AnalysisRow,
  type DateRange,
  type DemoInventory,
  type Relocation,
} from "./model";

const { Text, Title, Paragraph } = Typography;
type Filter = "all" | "mismatch" | "pending";
interface Props {
  inventory: DemoInventory;
  onChange: (next: DemoInventory) => void;
}
const formatDate = (date: string) => dayjs(date).format("D MMM YYYY");
const rangeLabel = (range: DateRange) =>
  `${formatDate(range[0])} – ${formatDate(range[1])}`;

export function AbcTag({
  classification,
}: {
  classification: AbcClass | null;
}) {
  return classification ? (
    <Tag className={`abc-tag abc-${classification}`}>{classification}</Tag>
  ) : (
    <Text type="secondary">—</Text>
  );
}
function StatusTag({
  row,
  pending,
}: {
  row: AnalysisRow;
  pending?: Relocation;
}) {
  if (pending) return <Tag className="status-pending">รอยืนยันย้าย</Tag>;
  if (!row.classification)
    return <Tag className="status-neutral">ไม่มีประวัติ</Tag>;
  return needsRelocation(row) ? (
    <Tag className="status-warning">ควรย้าย</Tag>
  ) : (
    <Tag className="status-aligned">ตรงโซนแล้ว</Tag>
  );
}

export function AbcWorkbench({ inventory, onChange }: Props) {
  const screens = Grid.useBreakpoint();
  const mobile = !screens.lg;
  const drawerMode = !screens.xl;
  const { message } = App.useApp();
  const [range, setRange] = useState<DateRange>(sampleRange);
  const [draftRange, setDraftRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs(sampleRange[0]),
    dayjs(sampleRange[1]),
  ]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState("P001");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const rows = useMemo(
    () => analyzeDemo(inventory.products, sampleWithdrawals, range),
    [inventory.products, range],
  );
  const pendingByProduct = new Map(
    inventory.pending.map((move) => [move.productId, move]),
  );
  const mismatch = rows.filter(
    (row) => needsRelocation(row) && !pendingByProduct.has(row.id),
  );
  const filtered = rows.filter(
    (row) =>
      filter === "all" ||
      (filter === "pending"
        ? pendingByProduct.has(row.id)
        : needsRelocation(row) && !pendingByProduct.has(row.id)),
  );
  const selected = rows.find((row) => row.id === selectedId);
  const total = rows.reduce((sum, row) => sum + row.frequency, 0);
  const dirty =
    draftRange[0]?.format("YYYY-MM-DD") !== range[0] ||
    draftRange[1]?.format("YYYY-MM-DD") !== range[1];

  function select(row: AnalysisRow) {
    setSelectedId(row.id);
    if (drawerMode) setDrawerOpen(true);
  }
  function analyze() {
    const [start, end] = draftRange;
    if (!start || !end) return;
    setRange([start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD")]);
    void message.success("วิเคราะห์ข้อมูลตัวอย่างแล้ว");
  }
  const columns: TableColumnsType<AnalysisRow> = [
    { title: "รหัส", dataIndex: "id", width: 76, responsive: ["xl"] },
    {
      title: "สินค้า",
      dataIndex: "name",
      width: undefined,
      render: (_, row) => (
        <div className="product-cell">
          <Button
            type="link"
            className="product-link"
            onClick={() => select(row)}
          >
            {row.name}
          </Button>
          <Text className="mobile-product-code" type="secondary">
            {row.id}
          </Text>
          {mobile && (
            <div className="mobile-product-status">
              <StatusTag row={row} pending={pendingByProduct.get(row.id)} />
            </div>
          )}
        </div>
      ),
    },
    {
      title: "เบิก (ครั้ง)",
      dataIndex: "frequency",
      width: 86,
      align: "right",
      responsive: ["lg"],
    },
    {
      title: "ABC",
      dataIndex: "classification",
      width: 58,
      render: (classification) => <AbcTag classification={classification} />,
    },
    { title: "ช่องปัจจุบัน", dataIndex: "location", width: mobile ? 82 : 104 },
    {
      title: "สถานะ",
      key: "status",
      responsive: ["lg"],
      width: mobile ? 124 : 142,
      render: (_, row) => (
        <StatusTag row={row} pending={pendingByProduct.get(row.id)} />
      ),
    },
  ];
  const panel = selected ? (
    <LocationPanel
      key={`${selected.id}-${pendingByProduct.get(selected.id)?.id ?? "draft"}`}
      row={selected}
      pending={pendingByProduct.get(selected.id)}
      range={range}
      inventory={inventory}
      onChange={onChange}
    />
  ) : (
    <Empty description="เลือกสินค้าเพื่อดูตำแหน่งจัดเก็บ" />
  );

  return (
    <>
      <div className="page-heading">
        <Title level={1}>วิเคราะห์ ABC และจัดตำแหน่ง</Title>
        <Paragraph type="secondary">
          เปรียบเทียบผลทั้งคลัง และจัดการสินค้าที่เลือกในแผงด้านข้าง
        </Paragraph>
      </div>
      <Alert
        className="demo-notice"
        type="info"
        showIcon
        title="ข้อมูลตัวอย่าง · ยังไม่บันทึกสต็อกจริง รีโหลดหรือออกจากระบบจะเริ่มใหม่"
      />
      <div className="abc-workbench">
        <section className="analysis-area" aria-label="ผลวิเคราะห์ ABC">
          <Form className="analysis-toolbar" layout="inline" onFinish={analyze}>
            <Form.Item
              className="date-range-field"
              label="ช่วงวันที่"
              htmlFor="analysis-range"
            >
              <DatePicker.RangePicker
                id={{ start: "analysis-range", end: "analysis-range-end" }}
                aria-label="ช่วงวันที่วิเคราะห์"
                value={draftRange}
                format="D MMM YYYY"
                allowClear={false}
                onChange={(values) =>
                  setDraftRange(values ? [values[0], values[1]] : [null, null])
                }
              />
            </Form.Item>
            <Form.Item>
              <Select
                aria-label="ช่วงเวลาสำเร็จรูป"
                value={
                  draftRange[1]?.isSame(dayjs(sampleRange[1]), "day") &&
                  draftRange[0]?.isSame(dayjs(sampleRange[0]), "day")
                    ? "90"
                    : "custom"
                }
                onChange={() =>
                  setDraftRange([dayjs(sampleRange[0]), dayjs(sampleRange[1])])
                }
                options={[
                  { value: "90", label: "ย้อนหลัง 90 วัน" },
                  { value: "custom", label: "กำหนดเอง", disabled: true },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Button
                htmlType="submit"
                disabled={!draftRange[0] || !draftRange[1]}
              >
                วิเคราะห์ใหม่
              </Button>
            </Form.Item>
          </Form>
          <div className="analysis-summary" aria-live="polite">
            <Text type="secondary">
              {rows.length} รายการ · เบิกรวม {total} ครั้ง
            </Text>
            <Text type="secondary" className="analysis-period">
              ผลช่วง {rangeLabel(range)}
            </Text>
            {dirty && (
              <Text className="stale-analysis">
                เปลี่ยนช่วงวันที่แล้ว กดวิเคราะห์ใหม่เพื่ออัปเดตผล
              </Text>
            )}
          </div>
          <Segmented<Filter>
            className="status-filter"
            aria-label="กรองสถานะสินค้า"
            value={filter}
            onChange={setFilter}
            options={[
              { label: `ทั้งหมด ${rows.length}`, value: "all" },
              { label: `ควรย้าย ${mismatch.length}`, value: "mismatch" },
              {
                label: `รอยืนยัน ${inventory.pending.length}`,
                value: "pending",
              },
            ]}
          />
          {total === 0 && (
            <Alert
              className="no-history-notice"
              type="info"
              showIcon
              title="ยังไม่มีประวัติเบิกในช่วงนี้"
              description="สินค้าแสดงเป็นไม่มีประวัติ ลองเลือกช่วงข้อมูลตัวอย่าง 20 ก.ค.–17 ต.ค. 2026"
            />
          )}
          <Table<AnalysisRow>
            rowKey="id"
            className="abc-table"
            columns={columns}
            dataSource={filtered}
            pagination={false}

            rowSelection={
              mobile
                ? undefined
                : {
                    type: "radio",
                    selectedRowKeys: [selectedId],
                    onChange: (_, selectedRows) => {
                      if (selectedRows[0]) select(selectedRows[0]);
                    },
                    getCheckboxProps: (row) => ({
                      "aria-label": `เลือก ${row.id} ${row.name}`,
                    }),
                  }
            }
            rowClassName={(row) =>
              row.id === selectedId ? "selected-product" : ""
            }
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    filter === "pending"
                      ? "ไม่มีรายการย้ายรอยืนยัน"
                      : "ไม่มีสินค้าที่ควรย้ายในช่วงข้อมูลนี้"
                  }
                >
                  <Button onClick={() => setFilter("all")}>
                    ดูสินค้าทั้งหมด
                  </Button>
                </Empty>
              ),
            }}
          />
          <div className="analysis-footnote">
            <Text type="secondary">
              แสดง {filtered.length} จาก {rows.length} รายการ ·
              นับแต่ละสินค้าหนึ่งครั้งต่อใบเบิกที่จ่ายสำเร็จ
            </Text>
            <Popover
              trigger="click"
              title="เกณฑ์สาธิตสำหรับข้อมูลตัวอย่าง"
              content={
                <div className="criteria-copy">
                  <p>A ถึงสัดส่วนสะสม 80% · B ถึง 95% · C ที่เหลือ</p>
                  <p>คำนวณจากจำนวนครั้งที่เบิก ไม่ใช่จำนวนชิ้นหรือมูลค่า</p>
                  <p>เกณฑ์จริง กรณีข้ามจุดตัด และคะแนนเท่ากันยังรอยืนยัน</p>
                  <p>ผลรวมคือความถี่ทุกสินค้า ไม่ใช่จำนวนใบเบิกไม่ซ้ำ</p>
                </div>
              }
            >
              <Button type="link" icon={<InfoCircleOutlined aria-hidden />}>
                เกณฑ์สาธิต ABC 80/95
              </Button>
            </Popover>
          </div>
        </section>
        {!drawerMode && (
          <aside
            className="location-panel"
            aria-label="จัดตำแหน่งสินค้าที่เลือก"
          >
            {panel}
          </aside>
        )}
      </div>
      {drawerMode && (
        <Drawer
          title={
            pendingByProduct.has(selectedId)
              ? "รอยืนยันการย้าย"
              : "เลือกช่องจัดเก็บ"
          }
          placement="right"
          size="100%"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          className="location-drawer"
          destroyOnHidden
        >
          {panel}
        </Drawer>
      )}
    </>
  );
}

function LocationPanel({
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
  onChange: Props["onChange"];
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
        failure instanceof Error
          ? failure.message
          : "ยืนยันไม่สำเร็จ กรุณาลองใหม่",
      );
    }
  }
  return (
    <div className="location-panel-inner">
      <div className="desktop-panel-heading">
        <Title level={2}>
          {pending ? "รอยืนยันการย้าย" : "เลือกช่องจัดเก็บ"}
        </Title>
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
          {row.cumulative === null
            ? "—"
            : `${Number(row.cumulative.toFixed(1))}%`}
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
            <Text type="secondary">
              ช่องปลายทาง · โซน {pending.classification}
            </Text>
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
              ย้ายสินค้าไป {pending.destination} ครบ {pending.quantity}{" "}
              {row.unit} แล้ว
            </Checkbox>
          </div>
          <Text type="secondary" className="pending-reference">
            {pending.id} · ผลวิเคราะห์ {rangeLabel(pending.range)}
          </Text>
          <Text type="secondary" className="reservation-note">
            การกันช่องในชุดทดลองนี้เป็นข้อเสนอ UX
          </Text>
          <div className="panel-actions">
            <Button
              type="primary"
              block
              disabled={!confirmed}
              onClick={confirm}
            >
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
