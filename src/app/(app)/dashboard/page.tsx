import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { currentMonth } from "@/lib/format";

// Bulan berjalan dihitung per permintaan (connection() menandai render ini dinamis), bukan dibekukan saat build.
async function Dashboard() {
  await connection();
  const month = currentMonth();
  return <DashboardView initialMonth={month} currentMonth={month} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <Dashboard />
    </Suspense>
  );
}
