import type { ReactNode } from "react";
import { FormDialog } from "../../../components/organisms/FormDialog";
import { useMasterDataSave } from "../hooks/useMasterDataSave";

export function MasterDataEditor<T extends object>({
  title,
  initialValues,
  children,
  onSave,
  onSaved,
  onCancel,
}: {
  title: string;
  initialValues: T;
  children: ReactNode;
  onSave: (values: T, key: string) => Promise<unknown>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { saving, error, submit } = useMasterDataSave(onSave, onSaved);
  return (
    <FormDialog<T>
      title={title}
      initialValues={initialValues}
      saving={saving}
      error={error}
      onSubmit={submit}
      onCancel={onCancel}
    >
      {children}
    </FormDialog>
  );
}
