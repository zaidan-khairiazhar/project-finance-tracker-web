import { LogoutButton } from "@/components/logout-button";

// Sementara: halaman penampung. Dashboard sebenarnya dibuat di Task 11 dan 13.
export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">Kamu sudah masuk. Isi dashboard menyusul di task berikutnya.</p>
      <div>
        <LogoutButton />
      </div>
    </main>
  );
}
