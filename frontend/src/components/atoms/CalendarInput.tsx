import { DatePicker } from "antd";
import dayjs from "dayjs";

/** Form values remain calendar strings rather than browser-dependent timestamps. */
export function CalendarInput({
  value,
  onChange,
  id,
}: {
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
}) {
  return (
    <DatePicker
      id={id}
      value={value ? dayjs(value) : null}
      onChange={(date) => onChange?.(date?.format("YYYY-MM-DD") ?? "")}
      format="DD/MM/YYYY"
    />
  );
}
