// ============================================
// useLab — Lab Management Hook
// ============================================
// Handles lab CRUD and local state.
// Extracted from DataContext to follow Single Responsibility Principle.

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lab } from "@/lib/global";

export function useLab(initialLabs: Lab[] = []) {
  const [labs, setLabs] = useState<Lab[]>(initialLabs);
  const supabaseRef = useRef(createClient());

  const addLab = useCallback(
    async (name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const duplicate = labs.find(
        (l) => l.lab_name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return false;

      const { data, error } = await supabaseRef.current
        .from("labs")
        .insert({ lab_name: trimmed })
        .select()
        .single();

      if (error || !data) {
        console.error("Failed to add lab:", error);
        return false;
      }

      setLabs((prev) => [...prev, { id: data.id, lab_name: data.lab_name }]);
      return true;
    },
    [labs]
  );

  const updateLab = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const duplicate = labs.find(
        (l) => l.id !== id && l.lab_name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return false;

      const { error } = await supabaseRef.current
        .from("labs")
        .update({ lab_name: trimmed })
        .eq("id", id);

      if (error) {
        console.error("Failed to update lab:", error);
        return false;
      }

      setLabs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, lab_name: trimmed } : l))
      );
      return true;
    },
    [labs]
  );

  const deleteLab = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabaseRef.current
        .from("labs")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Failed to delete lab:", error);
        return false;
      }

      setLabs((prev) => prev.filter((l) => l.id !== id));
      return true;
    },
    []
  );

  return { labs, setLabs, addLab, updateLab, deleteLab };
}
