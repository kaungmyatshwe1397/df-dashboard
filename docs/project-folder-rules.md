# Component Architecture & File Organization Rule

## Pattern: Component Folder + Index Pattern (camelCase)

Always follow this structure when creating new complex components or refactoring large files (especially multi-subcomponent forms, dashboards, or complex cards) inside the `components/` directory.

### 1. Folder & File Structure (camelCase)
- **Folder Naming:** Use `camelCase` for component directories (e.g., `components/records/patientRecordForm/`).
- **Main Component (`index.tsx`):**
  - The primary orchestrator component must always reside at `index.tsx` inside its dedicated folder.
  - It must serve as the single public entry point for that component module.
- **Subcomponents:**
  - Break down large components into flat sibling files in the same directory using `camelCase` (e.g., `vitalsSection.tsx`, `medicalHistory.tsx`).
  - Do NOT create deep nested folders (e.g., avoid `subcomponents/` subfolders). Keep them flat alongside `index.tsx`.
- **Types & Schemas:**
  - Extract component-specific TypeScript interfaces/types into a local `types.ts`.
  - Extract validation logic (Zod, Yup, etc.) into a local `schema.ts`.

### 2. Import & Export Conventions
- **Exports:**
  - Export the main component via named export from `index.tsx`:
    ```tsx
    export function PatientRecordForm() { ... }
    ```
- **External Imports:**
  - Always import via the folder name, leveraging the `index.tsx` resolution:
    ```tsx
    // Correct
    import { PatientRecordForm } from "@/components/records/patientRecordForm";

    // Incorrect - do not reference index directly
    import { PatientRecordForm } from "@/components/records/patientRecordForm/index";
    ```
- **Internal Imports:**
  - Subcomponents and types within the same directory must use local relative paths:
    ```tsx
    import { VitalsSection } from "./vitalsSection";
    import { PatientFormData } from "./types";
    ```

### 3. File Size & Refactoring Triggers
- When any component file exceeds ~150 lines or manages distinct UI sections (like multi-step forms or tabs), automatically split it into this pattern.
- Maintain pure presentation or single-purpose logic in subcomponents; keep orchestration and top-level state in `index.tsx`.


**Example File Tree**
components/records/patientRecordForm/
├── index.tsx              <-- Main component entry
├── vitalsSection.tsx      <-- Subcomponent (camelCase)
├── medicalHistory.tsx     <-- Subcomponent (camelCase)
└── types.ts               <-- Types