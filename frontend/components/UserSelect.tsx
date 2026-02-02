"use client";

import { User } from "@/types/user";
import { Input } from "@/components/ui";
import React from "react";

export default function UserSelect({
  users,
  selected,
  onChange,
  title = "افراد",
}: {
  users: User[];
  selected: number[];
  onChange: (ids: number[]) => void;
  title?: string;
}) {
  const [q, setQ] = React.useState("");
  const filtered = users.filter((u) => `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase().includes(q.toLowerCase()));

  const toggle = (id: number) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-[var(--muted)]">{title}</div>
      <Input placeholder="جستجو…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-56 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {filtered.map((u) => (
          <label
            key={u.id}
            className="flex items-center justify-between px-3 py-2 text-sm border-b border-[var(--border)]/60 last:border-b-0"
          >
            <div className="min-w-0">
              <div className="truncate">{u.first_name} {u.last_name}</div>
              <div className="text-xs text-[var(--muted)] truncate">@{u.username}</div>
            </div>
            <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} className="h-4 w-4" />
          </label>
        ))}
        {filtered.length === 0 && <div className="p-3 text-sm text-[var(--muted)]">موردی پیدا نشد</div>}
      </div>
    </div>
  );
}
