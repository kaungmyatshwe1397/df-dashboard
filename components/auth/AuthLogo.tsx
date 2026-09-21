// AuthLogo — clinic brand mark for auth pages.
// Uses the clinic logo image with the clinic name.

import React from "react";
import Image from "next/image";

export function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Image
        src="/clinic-logo.jpg"
        alt="Shwe Taw Win Dental Clinic"
        width={48}
        height={48}
        className="h-12 w-12 rounded-xl object-cover"
        priority
      />
      <span className="text-sm font-semibold tracking-wide text-white/80">
        Shwe Taw Win Dental Clinic
      </span>
    </div>
  );
}
