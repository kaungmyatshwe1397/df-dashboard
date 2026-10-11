// Labelled values keep dense mobile data understandable without table headers.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="m-0 whitespace-normal [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
