import { useEffect, useState } from "react";
import { loadHistory, masterDataError } from "../api/client";
import type { EntityType, InventoryEvent } from "../types";

export function useHistory(entityType: EntityType, id: string) {
  const [events, setEvents] = useState<InventoryEvent[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setEvents(null);
    setError("");
    loadHistory(entityType, id)
      .then((result) => {
        if (active) setEvents(result.events);
      })
      .catch((failure) => {
        if (active) setError(masterDataError(failure));
      });
    return () => {
      active = false;
    };
  }, [entityType, id]);
  return { events, error };
}
