import { Button } from "@/components/ui/button";
import { formatMonth, shiftMonth } from "@/lib/format";

type Props = { value: string; max: string; onChange: (month: string) => void };

export function MonthPicker({ value, max, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" aria-label="Bulan sebelumnya" onClick={() => onChange(shiftMonth(value, -1))}>
        ‹
      </Button>
      <span className="min-w-32 text-center text-sm font-medium" aria-live="polite">
        {formatMonth(value)}
      </span>
      <Button variant="outline" size="sm" aria-label="Bulan berikutnya" disabled={value >= max} onClick={() => onChange(shiftMonth(value, 1))}>
        ›
      </Button>
      {value !== max && (
        <Button variant="ghost" size="sm" onClick={() => onChange(max)}>
          Bulan ini
        </Button>
      )}
    </div>
  );
}
