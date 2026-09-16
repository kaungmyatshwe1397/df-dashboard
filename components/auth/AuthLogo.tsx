// AuthLogo — DC-FMS brand mark for auth pages.
// Accent-colored icon square with "DC" wordmark.

import React from "react";

export function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold"
        style={{
          background: "rgba(124,106,240,0.85)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        DC
      </div>
      <span className="text-sm font-semibold tracking-wide text-white/80">
        DC-FMS
      </span>
    </div>
  );
}
