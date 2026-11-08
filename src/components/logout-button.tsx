"use client";

import { useRouter } from "next/navigation";
import { sessionRequest } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
      onClick={async () => {
        await sessionRequest("", { method: "DELETE" }).catch(() => undefined);
        router.replace("/login");
      }}
    >
      Keluar
    </button>
  );
}
