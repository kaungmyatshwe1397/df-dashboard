"use client";

import { type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface KpiCardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  badge?: {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
  footer?: React.ReactNode;
}

export function KpiCard({ title, value, icon: Icon, badge, footer }: KpiCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-body-sm font-medium text-muted-foreground">
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight md:text-3xl break-all">
            {value}
          </span>
          {badge && (
            <Badge variant={badge.variant} className="shrink-0">
              {badge.label}
            </Badge>
          )}
        </div>
        {footer && (
          <>
            <Separator className="my-3" />
            {footer}
          </>
        )}
      </CardContent>
    </Card>
  );
}
