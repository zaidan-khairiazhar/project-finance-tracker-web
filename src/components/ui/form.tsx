import type { FieldError } from "react-hook-form";

export const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60 aria-[invalid=true]:border-destructive";

type Props = { id: string; label: string; error?: FieldError; hint?: string; children: React.ReactNode };

/** Label + kontrol + hint/error. Kontrol (input/select) diberi `id` yang sama dari luar. */
export function FormField({ id, label, error, hint, children }: Props) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
