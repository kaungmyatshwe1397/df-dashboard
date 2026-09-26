// Patient detail route (assistant) — reads ?id=NNNN/YY and opens the patient
// card dialog over a minimal page backdrop. Closing returns to the list.
// useSearchParams requires a Suspense boundary (Next.js App Router).

"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { PatientDetailDialog } from "@/components/patients/registeredPatientsTable";
import { Spinner } from "@/components/ui/spinner";

function PatientDetailContent({ listPath }: { listPath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id") ?? "";

  return (
    <PatientDetailDialog
      patientId={patientId}
      onClose={() => router.push(listPath)}
    />
  );
}

export default function AssistantRegisterPatientsDetailPage() {
  return (
    <PortalLayout>
      <div>
        <h1 className="text-h1 font-bold text-foreground m-0 mb-1">
          Registered Patients
        </h1>
        <p className="text-body-sm text-muted-foreground m-0 mb-7">
          Patient details from the registry.
        </p>
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Spinner className="h-6 w-6" />
            </div>
          }
        >
          <PatientDetailContent listPath="/assistant/register-patients" />
        </Suspense>
      </div>
    </PortalLayout>
  );
}
