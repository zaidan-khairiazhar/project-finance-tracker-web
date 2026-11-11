import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportsView } from "@/features/reports/ReportsView";

async function Reports({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { tab } = await searchParams;
  return <ReportsView tab={Array.isArray(tab) ? tab[0] : tab} />;
}

export default function ReportsPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <Reports searchParams={searchParams} />
    </Suspense>
  );
}
