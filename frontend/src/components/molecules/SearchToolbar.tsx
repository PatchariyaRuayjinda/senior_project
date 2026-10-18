import { Input } from "antd";
import type { ReactNode } from "react";

export function SearchToolbar({
  label,
  placeholder,
  query,
  onQueryChange,
  children,
}: {
  label: string;
  placeholder: string;
  query: string;
  onQueryChange: (query: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="master-data-toolbar">
      <Input.Search
        aria-label={label}
        placeholder={placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        allowClear
      />
      {children}
    </div>
  );
}
