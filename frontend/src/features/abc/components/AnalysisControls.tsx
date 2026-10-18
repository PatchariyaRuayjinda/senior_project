import {
  Alert,
  Button,
  DatePicker,
  Form,
  Segmented,
  Select,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { sampleRange, type DateRange } from "../model";

import { rangeLabel } from "../format";

const { Text } = Typography;
type Filter = "all" | "mismatch" | "pending";

export function AnalysisControls({
  draftRange,
  onDraftRangeChange,
  onAnalyze,
  range,
  rowsCount,
  total,
  dirty,
  filter,
  onFilterChange,
  mismatchCount,
  pendingCount,
}: {
  draftRange: [Dayjs | null, Dayjs | null];
  onDraftRangeChange: (range: [Dayjs | null, Dayjs | null]) => void;
  onAnalyze: () => void;
  range: DateRange;
  rowsCount: number;
  total: number;
  dirty: boolean;
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
  mismatchCount: number;
  pendingCount: number;
}) {
  return (
    <>
      <Form className="analysis-toolbar" layout="inline" onFinish={onAnalyze}>
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
              onDraftRangeChange(values ? [values[0], values[1]] : [null, null])
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
              onDraftRangeChange([dayjs(sampleRange[0]), dayjs(sampleRange[1])])
            }
            options={[
              { value: "90", label: "ย้อนหลัง 90 วัน" },
              { value: "custom", label: "กำหนดเอง", disabled: true },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" disabled={!draftRange[0] || !draftRange[1]}>
            วิเคราะห์ใหม่
          </Button>
        </Form.Item>
      </Form>
      <div className="analysis-summary" aria-live="polite">
        <Text type="secondary">
          {rowsCount} รายการ · เบิกรวม {total} ครั้ง
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
        onChange={onFilterChange}
        options={[
          { label: `ทั้งหมด ${rowsCount}`, value: "all" },
          { label: `ควรย้าย ${mismatchCount}`, value: "mismatch" },
          {
            label: `รอยืนยัน ${pendingCount}`,
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
    </>
  );
}
