import { ChangeHistoryDrawer } from "../../../components/organisms/ChangeHistoryDrawer";
import { fieldLabels } from "../historyFields";
import { useHistory } from "../hooks/useHistory";
import type { EntityType } from "../types";

export function HistoryDrawer({
  entityType,
  id,
  title,
  onClose,
}: {
  entityType: EntityType;
  id: string;
  title: string;
  onClose: () => void;
}) {
  const { events, error } = useHistory(entityType, id);
  return (
    <ChangeHistoryDrawer
      title={title}
      onClose={onClose}
      events={events}
      error={error}
      fields={fieldLabels}
    />
  );
}
