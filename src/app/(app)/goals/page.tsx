import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalsView } from "@/features/goals/GoalsView";

export default function GoalsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <GoalsView />
    </Suspense>
  );
}
