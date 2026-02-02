"use client";

import React from "react";
import { Modal, Button, Input, Textarea, Label } from "@/components/ui";
import type { User } from "@/types/user";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));

  React.useEffect(() => {
    if (!open) return;
    setToUserId("");
    setAmount("");
    setDesc("");
    setDate(new Date().toISOString().slice(0, 10));
  }, [open]);

  const create = useMutation({
    mutationFn: async () => {
      const body = {
        to_user_id: Number(toUserId),
        amount: Number(amount),
        description: desc || null,
        payment_date: date,
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
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
