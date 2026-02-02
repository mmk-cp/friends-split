"use client";

import React from "react";
import { Modal, Button, Input, Textarea, Label } from "@/components/ui";
import UserSelect from "@/components/UserSelect";
import type { User } from "@/types/user";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setAmount("");
    setDesc("");
    setDate(new Date().toISOString().slice(0, 10));
    setSelected([]);
  }, [open]);

  const create = useMutation({
    mutationFn: async () => {
      const body = {
        amount: Number(amount),
        description: desc || null,
        expense_date: date,
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

  const canSubmit = Number(amount) > 0 && selected.length > 0;

  return (
    <Modal open={open} onClose={onClose} title="ثبت هزینه جدید">
      <div className="space-y-3">
        <div>
          <Label>مبلغ</Label>
          <Input inputMode="decimal" placeholder="مثلاً 250000" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <Label>توضیح</Label>
          <Textarea placeholder="اختیاری" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>تاریخ</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
        <div className="text-xs text-slate-500">
          نکته: می‌توانی خودت را انتخاب نکنی. مبلغ بین افراد انتخاب‌شده مساوی تقسیم می‌شود.
        </div>
      </div>
    </Modal>
  );
}
