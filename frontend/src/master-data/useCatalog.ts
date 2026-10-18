import { useCallback, useEffect, useRef, useState } from "react";
import { loadCatalog, masterDataError } from "./client";
import type { Catalog } from "./types";

const emptyCatalog: Catalog = {
  products: [],
  lots: [],
  locations: [],
  pallets: [],
};

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);

  const reload = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const result = await loadCatalog();
      if (version === requestVersion.current) setCatalog(result);
    } catch (failure) {
      if (version === requestVersion.current)
        setError(masterDataError(failure));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return () => {
      requestVersion.current++;
    };
  }, [reload]);

  return { catalog, loading, error, reload };
}
