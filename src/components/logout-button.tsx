"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { sessionRequest } from "@/lib/api";
import { Button } from "./ui/button";

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await sessionRequest("", { method: "DELETE" }).catch(() => undefined);
        queryClient.clear(); // buang data user ini dari cache
        router.replace("/login");
      }}
    >
      Keluar
    </Button>
  );
}
