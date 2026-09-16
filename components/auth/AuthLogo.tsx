// AuthLogo — clinic brand mark for auth pages.
// Uses the clinic logo image with the clinic name.

import React from "react";

export function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src="/clinic-logo.jpg"
        alt="Shwe Taw Win Dental Clinic"
        className="h-12 w-12 rounded-xl object-cover"
      />
      <span className="text-sm font-semibold tracking-wide text-white/80">
        Shwe Taw Win Dental Clinic
      </span>
    </div>
  );
}
