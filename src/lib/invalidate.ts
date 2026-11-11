import type { QueryClient } from "@tanstack/react-query";

/** Menyegarkan semua query yang kuncinya diawali salah satu `keys`. */
export function invalidateKeys(queryClient: QueryClient, keys: string[]) {
  return Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}
