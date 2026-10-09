import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/30 bg-destructive/10">
      <div className="flex items-center justify-between py-6 px-6">
        <p className="text-sm text-destructive">
          Failed to calculate dashboard metrics.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} className="border-destructive/30 text-destructive hover:bg-destructive/10">
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Retry
        </Button>
      </div>
    </Card>
  );
}
