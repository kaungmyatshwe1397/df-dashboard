import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex items-center justify-between py-6">
        <p className="text-body-sm text-destructive">
          Failed to calculate dashboard metrics.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
