import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetsView } from "@/features/budgets/BudgetsView";
import { currentMonth } from "@/lib/format";

// Bulan berjalan dihitung per permintaan (connection() menandai render ini dinamis), bukan dibekukan saat build.
async function Budgets() {
  await connection();
  const month = currentMonth();
  return <BudgetsView initialMonth={month} currentMonth={month} />;
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <Budgets />
    </Suspense>
  );
}
