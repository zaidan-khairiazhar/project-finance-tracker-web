"use client";

import { useState } from "react";
import { inputClass } from "@/components/ui/form";
import type { DateRange } from "./api";

const MAX_DAYS = 366;
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000;

function validate({ from, to }: DateRange): string | null {
  const span = dayNumber(to) - dayNumber(from);
  if (span < 0) return "Tanggal akhir tidak boleh sebelum tanggal awal.";
  if (span + 1 > MAX_DAYS) return "Rentang maksimum 366 hari.";
  return null;
}

/** Dua kolom tanggal (inklusif). Rentang yang tidak valid ditolak dan tidak diteruskan ke `onChange`. */
export function RangePicker({ value, onChange }: { value: DateRange; onChange: (range: DateRange) => void }) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof DateRange, next: string) {
    const range = { ...draft, [key]: next };
    setDraft(range);
    if (!range.from || !range.to) return;

    const problem = validate(range);
    setError(problem);
    if (!problem) onChange(range);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        {(["from", "to"] as const).map((key) => (
          <div key={key} className="space-y-1.5">
            <label htmlFor={`range-${key}`} className="text-sm font-medium">{key === "from" ? "Dari" : "Sampai"}</label>
            <input
              id={`range-${key}`}
              type="date"
              className={`${inputClass} w-auto`}
              value={draft[key]}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "range-error" : undefined}
              onChange={(e) => update(key, e.target.value)}
            />
          </div>
        ))}
      </div>
      {error && (
        <p id="range-error" role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
