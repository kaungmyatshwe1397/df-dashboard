// Category routing keeps both record forms independent of the patient registration workflow.
"use client";

import { RecordCategory } from "@/lib/global";
import { NewGpRecord } from "../newGpRecord";
import { NewCaseRecord } from "../newCaseRecord";

export function NewPatientRecord({ listPath, category }: { listPath: string; category: RecordCategory }) {
  return category === RecordCategory.GP ? <NewGpRecord listPath={listPath} /> : <NewCaseRecord listPath={listPath} />;
}
