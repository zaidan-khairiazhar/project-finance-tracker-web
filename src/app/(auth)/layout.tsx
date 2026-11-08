export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            Rp
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Finance Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catat keuanganmu, lihat ke mana uangnya pergi.</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
