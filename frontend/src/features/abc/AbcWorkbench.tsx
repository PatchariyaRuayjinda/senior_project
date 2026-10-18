import { InfoCircleOutlined } from "@ant-design/icons";
import { Alert, App, Button, Drawer, Empty, Grid, Popover, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { PageHeading } from "../../components/molecules/PageHeading";
import { AbcAnalysisTable } from "./components/AbcAnalysisTable";
import { AnalysisControls } from "./components/AnalysisControls";
import { LocationPanel } from "./components/LocationPanel";
import {
  analyzeDemo,
  needsRelocation,
  sampleRange,
  sampleWithdrawals,
  type AnalysisRow,
  type DateRange,
  type DemoInventory,
} from "./model";

const { Text, Title, Paragraph } = Typography;
type Filter = "all" | "mismatch" | "pending";
interface Props {
  inventory: DemoInventory;
  onChange: (next: DemoInventory) => void;
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
      <PageHeading
        title="วิเคราะห์ ABC และจัดตำแหน่ง"
        description="เปรียบเทียบผลทั้งคลัง และจัดการสินค้าที่เลือกในแผงด้านข้าง"
      />
      <Alert
        className="demo-notice"
        type="info"
        showIcon
        title="ข้อมูลตัวอย่าง · ยังไม่บันทึกสต็อกจริง รีโหลดหรือออกจากระบบจะเริ่มใหม่"
      />
      <div className="abc-workbench">
        <section className="analysis-area" aria-label="ผลวิเคราะห์ ABC">
          <AnalysisControls
            draftRange={draftRange}
            onDraftRangeChange={setDraftRange}
            onAnalyze={analyze}
            range={range}
            rowsCount={rows.length}
            total={total}
            dirty={dirty}
            filter={filter}
            onFilterChange={setFilter}
            mismatchCount={mismatch.length}
            pendingCount={inventory.pending.length}
          />
          <AbcAnalysisTable
            rows={filtered}
            selectedId={selectedId}
            mobile={mobile}
            pendingByProduct={pendingByProduct}
            onSelect={select}
            filter={filter}
            onShowAll={() => setFilter("all")}
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
          <aside className="location-panel" aria-label="จัดตำแหน่งสินค้าที่เลือก">
            {panel}
          </aside>
        )}
      </div>
      {drawerMode && (
        <Drawer
          title={
            pendingByProduct.has(selectedId) ? "รอยืนยันการย้าย" : "เลือกช่องจัดเก็บ"
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
