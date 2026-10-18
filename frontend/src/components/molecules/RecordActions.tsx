import { Button, Space } from "antd";

export function RecordActions({
  label,
  onEdit,
  onHistory,
  editDisabled = false,
}: {
  label: string;
  onEdit?: () => void;
  onHistory: () => void;
  editDisabled?: boolean;
}) {
  return (
    <Space>
      {onEdit && (
        <Button
          type="link"
          aria-label={`แก้ไข ${label}`}
          onClick={onEdit}
          disabled={editDisabled}
        >
          แก้ไข
        </Button>
      )}
      <Button type="link" aria-label={`ประวัติ ${label}`} onClick={onHistory}>
        ประวัติ
      </Button>
    </Space>
  );
}
