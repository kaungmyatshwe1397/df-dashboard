"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  note?: string;
  variant?: "default" | "profit";
  className?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = "neutral",
  note,
  variant = "default",
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] border p-[18px] transition-colors h-full flex flex-col justify-between",
        variant === "profit"
          ? "bg-accent-dark border-accent/20"
          : "bg-card border-border",
        className
      )}
    >
      <div className="flex justify-between items-start mb-3.5">
        <span className="text-xs text-muted-foreground">{title}</span>
        {Icon && (
          <div className="w-[30px] h-[30px] rounded-lg bg-input flex items-center justify-center text-sm">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div
        className={cn(
          "text-[24px] font-bold tracking-tight",
          variant === "profit" ? "text-accent" : "text-foreground"
        )}
      >
        {value}
      </div>

      {change && (
        <div
          className={cn(
            "text-[11px] font-semibold mt-1.5",
            changeType === "up" && "text-accent",
            changeType === "down" && "text-danger",
            changeType === "neutral" && "text-muted-foreground"
          )}
        >
          {changeType === "up" && "↗ "}
          {changeType === "down" && "↘ "}
          {change}
        </div>
      )}

      {note && (
        <div className="text-[12px] text-muted-foreground mt-1.5">{note}</div>
      )}
    </div>
  );
}
