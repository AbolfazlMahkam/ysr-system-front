import { useState, useEffect } from "react";
import formsApi from "../api/forms";

interface FormSchema {
  id: number;
  slug: string;
  title: string;
  description: string | null;
}

export function useActiveForms() {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const data = await formsApi.getActiveSchemas();
        if (!cancelled) setForms(data || []);
      } catch {
        if (!cancelled) setForms([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();

    return () => {
      cancelled = true;
    };
  }, []);

  return { forms, loading };
}
