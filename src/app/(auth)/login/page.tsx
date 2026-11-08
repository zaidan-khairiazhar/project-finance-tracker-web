"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError, sessionRequest } from "@/lib/api";
import { applyServerErrors } from "@/lib/forms";
import { Field, PasswordField, buttonClass } from "../_form";

const schema = z.object({
  email: z.string().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await sessionRequest("", { method: "POST", body: JSON.stringify(values) });
      router.replace("/dashboard");
    } catch (error) {
      if (applyServerErrors(error, setError)) return;
      setError("root", { message: error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi." });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <h2 className="text-lg font-semibold">Masuk</h2>
      <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
      <PasswordField id="password" label="Kata sandi" autoComplete="current-password" error={errors.password} {...register("password")} />
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Memproses..." : "Masuk"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Daftar
        </Link>
      </p>
    </form>
  );
}
