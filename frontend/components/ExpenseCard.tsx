"use client";

import { Expense } from "@/types/expense";
import { User } from "@/types/user";
import { Badge, Button, Card } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatJalaliDate } from "@/lib/jalali";
import { formatToman } from "@/lib/format";

function userName(users: User[], id: number) {
  const u = users.find((x) => x.id === id);
  return u ? `${u.first_name} ${u.last_name}` : `#${id}`;
}

export default function ExpenseCard({
  expense,
  users,
  myId,
  isAdmin,
}: {
  expense: Expense;
  users: User[];
  myId: number;
  isAdmin: boolean;
}) {
  const toast = useToast();
  const qc = useQueryClient();

  const needsMyApproval = expense.participants.some((p) => p.user_id === myId && !p.approved);
  const canAdminDelete = isAdmin && expense.status !== "approved";

  const approve = useMutation({
    mutationFn: async () => apiFetch(`/expenses/${expense.id}/approve`, { method: "POST", auth: true }),
    onSuccess: async () => {
      toast.push({ type: "success", message: "تایید شد" });
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["pendingApprovals"] });
      await qc.invalidateQueries({ queryKey: ["settlement"] });
    },
    onError: (e: any) => toast.push({ type: "error", message: e.message || "خطا" }),
  });

  const remove = useMutation({
    mutationFn: async () => apiFetch(`/expenses/${expense.id}`, { method: "DELETE", auth: true }),
    onSuccess: async () => {
      toast.push({ type: "success", message: "هزینه حذف شد" });
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["pendingApprovals"] });
      await qc.invalidateQueries({ queryKey: ["settlement"] });
    },
    onError: (e: any) => toast.push({ type: "error", message: e.message || "خطا" }),
  });

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold font-display truncate">{expense.description || "هزینه"}</div>
          <div className="text-xs text-[var(--muted)] mt-1">
            پرداخت‌کننده: {userName(users, expense.payer_id)} • تاریخ: {formatJalaliDate(expense.expense_date)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold">{formatToman(expense.amount)}</div>
          <div className="mt-1">
            {expense.status === "approved" ? <Badge tone="green">تایید شده</Badge> : <Badge tone="amber">در انتظار</Badge>}
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-[var(--border)] pt-3">
        <div className="text-xs font-medium text-[var(--muted)] mb-2">مشارکت‌کنندگان</div>
        <div className="flex flex-col gap-2">
          {expense.participants.map((p) => (
            <div key={p.user_id} className="flex items-center justify-between text-sm">
              <div className="truncate">
                {userName(users, p.user_id)}{" "}
                <span className="text-xs text-[var(--muted)]">({formatToman(p.share_amount)})</span>
              </div>
              {p.approved ? <Badge tone="green">OK</Badge> : <Badge tone="amber">Pending</Badge>}
            </div>
          ))}
        </div>

        {(needsMyApproval || canAdminDelete) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {needsMyApproval && (
              <Button onClick={() => approve.mutate()} disabled={approve.isPending}>
                تایید این هزینه
              </Button>
            )}
            {canAdminDelete && (
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm("این هزینه تایید نشده حذف شود؟")) remove.mutate();
                }}
                disabled={remove.isPending}
              >
                حذف هزینه تایید نشده
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
