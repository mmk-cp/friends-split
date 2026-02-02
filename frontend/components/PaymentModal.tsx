"use client";

import React from "react";
import { Modal, Button, Input, Textarea, Label } from "@/components/ui";
import type { User } from "@/types/user";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jalaliMonthLength, jalaliMonthName, jalaliToGregorianISO, todayJalaliDate } from "@/lib/jalali";

export default function PaymentModal({
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
  const [toUserId, setToUserId] = React.useState<number | "">("");
  const [amount, setAmount] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [jy, setJy] = React.useState(() => todayJalaliDate().year);
  const [jm, setJm] = React.useState(() => todayJalaliDate().month);
  const [jd, setJd] = React.useState(() => todayJalaliDate().day);

  React.useEffect(() => {
    if (!open) return;
    setToUserId("");
    setAmount("");
    setDesc("");
    const t = todayJalaliDate();
    setJy(t.year);
    setJm(t.month);
    setJd(t.day);
  }, [open]);

  React.useEffect(() => {
    const maxDay = jalaliMonthLength(jy, jm);
    if (jd > maxDay) setJd(maxDay);
  }, [jy, jm, jd]);

  const create = useMutation({
    mutationFn: async () => {
      const body = {
        to_user_id: Number(toUserId),
        amount: Number(amount),
        description: desc || null,
        payment_date: jalaliToGregorianISO(jy, jm, jd),
      };
      return apiFetch("/payments", { method: "POST", auth: true, body: JSON.stringify(body) });
    },
    onSuccess: async () => {
      toast.push({ type: "success", message: "پرداخت ثبت شد" });
      onClose();
      await qc.invalidateQueries({ queryKey: ["payments"] });
      await qc.invalidateQueries({ queryKey: ["settlement"] });
    },
    onError: (e: any) => toast.push({ type: "error", message: e.message || "خطا" }),
  });

  const canSubmit = Number(amount) > 0 && toUserId !== "";
  const daysInMonth = jalaliMonthLength(jy, jm);
  const selectClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200";

  return (
    <Modal open={open} onClose={onClose} title="ثبت پرداخت">
      <div className="space-y-3">
        <div>
          <Label>به چه کسی؟</Label>
          <select
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">انتخاب کنید…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name} (@{u.username})
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>مبلغ</Label>
          <Input inputMode="decimal" placeholder="مثلاً 150000" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
          <div className="mt-1 text-xs text-slate-500">تاریخ شمسی (پیش‌فرض: امروز)</div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} type="button" className="flex-1">
            انصراف
          </Button>
          <Button onClick={() => create.mutate()} disabled={!canSubmit || create.isPending} className="flex-1">
            ثبت
          </Button>
        </div>
      </div>
    </Modal>
  );
}
