import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-danger/30 bg-danger-bg">
      <div className="flex items-center justify-between py-6 px-6">
        <p className="text-sm text-danger">
          Failed to calculate dashboard metrics.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} className="border-danger/30 text-danger hover:bg-danger/10">
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Retry
        </Button>
      </div>
    </Card>
  );
}
