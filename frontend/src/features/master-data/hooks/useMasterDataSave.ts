import { useRef, useState } from "react";
import { masterDataError } from "../api/client";

export function useMasterDataSave<T extends object>(
  onSave: (values: T, key: string) => Promise<unknown>,
  onSaved: () => void,
) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const attempt = useRef<{ body: string; key: string } | null>(null);

  async function submit(values: T) {
    if (saving) return;
    const body = JSON.stringify(values);
    if (attempt.current?.body !== body)
      attempt.current = { body, key: crypto.randomUUID() };
    setSaving(true);
    setError("");
    try {
      await onSave(values, attempt.current.key);
      onSaved();
    } catch (failure) {
      setError(masterDataError(failure));
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, submit };
}
