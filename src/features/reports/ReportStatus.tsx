import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";

export function ReportLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label}>
      <Skeleton className="h-64" />
    </div>
  );
}

export function ReportError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
      <span>{error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi."}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>Coba lagi</Button>
    </div>
  );
}
