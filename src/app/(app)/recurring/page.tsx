import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RecurringView } from "@/features/recurring/RecurringView";

export default function RecurringPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <RecurringView />
    </Suspense>
  );
}
