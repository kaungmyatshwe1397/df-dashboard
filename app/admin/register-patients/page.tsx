// Registered Patients (admin) — registry listing with search + pagination.
// Row click routes to the detail page where the patient card dialog opens.

"use client";

import { useRouter } from "next/navigation";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { RegisteredPatientsTable } from "@/components/patients/registeredPatientsTable";

export default function AdminRegisterPatientsPage() {
  const router = useRouter();

  return (
    <PortalLayout>
      <div>
        <h1 className="text-h1 font-bold text-foreground m-0 mb-1">
          Registered Patients
        </h1>
        <p className="text-body-sm text-muted-foreground m-0 mb-7">
          Every patient in the registry. Select a row to view full details.
        </p>
        <RegisteredPatientsTable
          onRowSelect={(patient) =>
            router.push(
              `/admin/register-patients/detail?id=${encodeURIComponent(patient.patient_id)}`
            )
          }
        />
      </div>
    </PortalLayout>
  );
}
