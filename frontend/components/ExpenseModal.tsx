"use client";

import React from "react";
import { Modal, Button, Input, Textarea, Label } from "@/components/ui";
import UserSelect from "@/components/UserSelect";
import type { User } from "@/types/user";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jalaliMonthLength, jalaliMonthName, jalaliToGregorianISO, todayJalaliDate } from "@/lib/jalali";
import { formatThousands, onlyDigits } from "@/lib/format";

export default function ExpenseModal({
  open,
  onClose,
  users,
}: {
  open: boolean;
  onClose: () => void;
  users: User[];
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const [amount, setAmount] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [jy, setJy] = React.useState(() => todayJalaliDate().year);
  const [jm, setJm] = React.useState(() => todayJalaliDate().month);
  const [jd, setJd] = React.useState(() => todayJalaliDate().day);
  const [selected, setSelected] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setAmount("");
    setDesc("");
    const t = todayJalaliDate();
    setJy(t.year);
    setJm(t.month);
    setJd(t.day);
    setSelected([]);
  }, [open]);

  React.useEffect(() => {
    const maxDay = jalaliMonthLength(jy, jm);
    if (jd > maxDay) setJd(maxDay);
  }, [jy, jm, jd]);

  const create = useMutation({
    mutationFn: async () => {
      const body = {
        amount: Number(onlyDigits(amount)),
        description: desc || null,
        expense_date: jalaliToGregorianISO(jy, jm, jd),
        participant_user_ids: selected,
      };
      return apiFetch("/expenses", { method: "POST", auth: true, body: JSON.stringify(body) });
    },
    onSuccess: async () => {
      toast.push({ type: "success", message: "هزینه ثبت شد (در انتظار تایید)" });
      onClose();
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["pendingApprovals"] });
      await qc.invalidateQueries({ queryKey: ["settlement"] });
    },
    onError: (e: any) => toast.push({ type: "error", message: e.message || "خطا" }),
  });

  const canSubmit = Number(onlyDigits(amount)) > 0 && selected.length > 0;
  const daysInMonth = jalaliMonthLength(jy, jm);
  const selectClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent)]";

  return (
    <Modal open={open} onClose={onClose} title="ثبت هزینه جدید">
      <div className="space-y-3">
        <div>
          <Label>مبلغ</Label>
          <div className="flex items-center gap-2">
            <Input
              inputMode="decimal"
              placeholder="مثلاً 250000"
              value={amount}
              onChange={(e) => setAmount(formatThousands(e.target.value))}
            />
            <span className="text-xs text-[var(--muted)] whitespace-nowrap">تومان</span>
          </div>
        </div>
        <div>
          <Label>توضیح</Label>
          <Textarea placeholder="اختیاری" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>تاریخ</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              value={jy}
              onChange={(e) => setJy(Number(e.target.value))}
              min={1200}
              max={1600}
              placeholder="سال"
            />
            <select className={selectClass} value={jm} onChange={(e) => setJm(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {jalaliMonthName(m)}
                </option>
              ))}
            </select>
            <select className={selectClass} value={jd} onChange={(e) => setJd(Number(e.target.value))}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">تاریخ شمسی (پیش‌فرض: امروز)</div>
        </div>

        <UserSelect users={users} selected={selected} onChange={setSelected} title="افراد داخل هزینه (تقسیم مساوی)" />

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} type="button" className="flex-1">
            انصراف
          </Button>
          <Button onClick={() => create.mutate()} disabled={!canSubmit || create.isPending} className="flex-1">
            ثبت
          </Button>
        </div>
        <div className="text-xs text-[var(--muted)]">
          نکته: می‌توانی خودت را انتخاب نکنی. مبلغ بین افراد انتخاب‌شده مساوی تقسیم می‌شود.
        </div>
      </div>
    </Modal>
  );
}
