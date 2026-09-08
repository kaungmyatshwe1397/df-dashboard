import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">404</h2>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/login">Go to login</Link>
      </Button>
    </div>
  );
}
