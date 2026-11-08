import { redirect } from "next/navigation";

// Biasanya sudah dialihkan oleh proxy.ts; ini hanya cadangan.
export default function Home() {
  redirect("/dashboard");
}
