// ============================================
// useCaseType — Case Type Management Hook
// ============================================
// Handles case type CRUD and local state.
// Extracted from DataContext to follow Single Responsibility Principle.

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { CaseType } from "@/lib/global";

export function useCaseType(initialCaseTypes: CaseType[] = []) {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>(initialCaseTypes);
  const supabaseRef = useRef(createClient());

  const addCaseType = useCallback(
    async (name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const duplicate = caseTypes.find(
        (ct) => ct.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return false;

      const { data, error } = await supabaseRef.current
        .from("case_types")
        .insert({ name: trimmed })
        .select()
        .single();

      if (error || !data) {
        console.error("Failed to add case type:", error);
        return false;
      }

      setCaseTypes((prev) => [...prev, { id: data.id, name: data.name }]);
      return true;
    },
    [caseTypes]
  );

  const updateCaseType = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const duplicate = caseTypes.find(
        (ct) => ct.id !== id && ct.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return false;

      const { error } = await supabaseRef.current
        .from("case_types")
        .update({ name: trimmed })
        .eq("id", id);

      if (error) {
        console.error("Failed to update case type:", error);
        return false;
      }

      setCaseTypes((prev) =>
        prev.map((ct) => (ct.id === id ? { ...ct, name: trimmed } : ct))
      );
      return true;
    },
    [caseTypes]
  );

  const deleteCaseType = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabaseRef.current
        .from("case_types")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Failed to delete case type:", error);
        return false;
      }

      setCaseTypes((prev) => prev.filter((ct) => ct.id !== id));
      return true;
    },
    []
  );

  return { caseTypes, setCaseTypes, addCaseType, updateCaseType, deleteCaseType };
}
