"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError, sessionRequest } from "@/lib/api";
import { applyServerErrors } from "@/lib/forms";
import { Field, PasswordField, buttonClass } from "../_form";

const schema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Nama maksimal 100 karakter."),
    email: z.string().min(1, "Email wajib diisi.").email("Format email tidak valid."),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    path: ["password_confirmation"],
    message: "Konfirmasi kata sandi tidak sama.",
  });
type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await sessionRequest("/register", { method: "POST", body: JSON.stringify(values) });
      router.replace("/dashboard");
    } catch (error) {
      if (applyServerErrors(error, setError)) return;
      setError("root", { message: error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi." });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <h2 className="text-lg font-semibold">Buat akun</h2>
      <Field id="name" label="Nama" autoComplete="name" error={errors.name} {...register("name")} />
      <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
      <PasswordField id="password" label="Kata sandi" autoComplete="new-password" error={errors.password} {...register("password")} />
      <PasswordField
        id="password_confirmation"
        label="Ulangi kata sandi"
        autoComplete="new-password"
        error={errors.password_confirmation}
        {...register("password_confirmation")}
      />
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Memproses..." : "Daftar"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
