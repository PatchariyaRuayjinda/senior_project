import dayjs from "dayjs";
import type { DateRange } from "./model";

export const formatDate = (date: string) => dayjs(date).format("D MMM YYYY");
export const rangeLabel = (range: DateRange) =>
  `${formatDate(range[0])} – ${formatDate(range[1])}`;
