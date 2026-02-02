"use client";

import { jalaliMonthName } from "@/lib/jalali";
import { Button } from "@/components/ui";

export default function MonthPicker({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
}) {
  const years = Array.from({ length: 8 }, (_, i) => year - 3 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={year}
        onChange={(e) => onChange(parseInt(e.target.value, 10), month)}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => onChange(year, parseInt(e.target.value, 10))}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {jalaliMonthName(m)}
          </option>
        ))}
      </select>
      <Button variant="secondary" onClick={() => onChange(year, month)} type="button">
        اعمال
      </Button>
    </div>
  );
}
