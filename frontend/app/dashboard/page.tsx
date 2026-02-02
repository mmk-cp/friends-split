"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Card, Button, Badge } from "@/components/ui";
import MonthPicker from "@/components/MonthPicker";
import ExpenseModal from "@/components/ExpenseModal";
import PaymentModal from "@/components/PaymentModal";
import ExpenseCard from "@/components/ExpenseCard";
import { todayJalaliYearMonth, jalaliMonthName } from "@/lib/jalali";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/store/authStore";
import { formatToman } from "@/lib/format";
import type { User } from "@/types/user";
import type { Expense } from "@/types/expense";
import type { SettlementReport } from "@/types/settlement";
import { useQuery } from "@tanstack/react-query";

function nameOf(users: User[], id: number) {
  const u = users.find((x) => x.id === id);
  return u ? `${u.first_name} ${u.last_name}` : `#${id}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const initial = React.useMemo(() => todayJalaliYearMonth(), []);
  const [year, setYear] = React.useState(initial.year);
  const [month, setMonth] = React.useState(initial.month);

  const [openExpense, setOpenExpense] = React.useState(false);
  const [openPayment, setOpenPayment] = React.useState(false);

  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<User[]>("/users", { auth: true }),
  });

  const expensesQ = useQuery({
    queryKey: ["expenses", year, month],
    queryFn: () => apiFetch<Expense[]>(`/expenses?shamsi_year=${year}&shamsi_month=${month}`, { auth: true }),
    enabled: !!user,
  });

  const pendingQ = useQuery({
    queryKey: ["pendingApprovals"],
    queryFn: () => apiFetch<Expense[]>("/expenses/pending-my-approvals", { auth: true }),
    enabled: !!user,
  });

  const settleQ = useQuery({
    queryKey: ["settlement", year, month],
    queryFn: () => apiFetch<SettlementReport>(`/settlements?shamsi_year=${year}&shamsi_month=${month}`, { auth: true }),
    enabled: !!user,
  });

  const users = usersQ.data || [];
  const expenses = expensesQ.data || [];
  const pending = pendingQ.data || [];
  const settlement = settleQ.data;

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container-page py-5 pb-24 sm:pb-8 space-y-4">
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-bold">داشبورد</div>
              <div className="text-sm text-slate-600 mt-1">
                ماه: {jalaliMonthName(month)} {year}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setOpenExpense(true)}>ثبت هزینه</Button>
              <Button variant="secondary" onClick={() => setOpenPayment(true)}>
                ثبت پرداخت
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
          </div>

          {pending.length > 0 && (
            <div className="mt-3 text-sm">
              <Badge tone="amber">شما {pending.length} هزینه برای تایید دارید</Badge>
            </div>
          )}
        </Card>

        {/* Pending approvals */}
        {pending.length > 0 && (
          <div className="space-y-3">
            <div className="font-semibold">در انتظار تایید شما</div>
            <div className="grid gap-3">
              {pending.map((e) => (
                <ExpenseCard key={e.id} expense={e} users={users} myId={user!.id} />
              ))}
            </div>
          </div>
        )}

        {/* Expenses list */}
        <div className="space-y-3">
          <div className="font-semibold">هزینه‌های این ماه</div>
          {expensesQ.isLoading ? (
            <div className="text-sm text-slate-600">در حال دریافت…</div>
          ) : expenses.length === 0 ? (
            <Card className="p-4 text-sm text-slate-600">هنوز هزینه‌ای ثبت نشده است.</Card>
          ) : (
            <div className="grid gap-3">
              {expenses.map((e) => (
                <ExpenseCard key={e.id} expense={e} users={users} myId={user!.id} />
              ))}
            </div>
          )}
        </div>

        {/* Settlement */}
        <div id="settlement" className="space-y-3 scroll-mt-24">
          <div className="font-semibold">تسویه این ماه</div>
          {settleQ.isLoading ? (
            <div className="text-sm text-slate-600">در حال محاسبه…</div>
          ) : !settlement || settlement.transfers.length === 0 ? (
            <Card className="p-4 text-sm text-slate-600">تراکنش پیشنهادی برای تسویه وجود ندارد.</Card>
          ) : (
            <Card className="p-4">
              <div className="space-y-2">
                {settlement.transfers.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium">{nameOf(users, t.from_user_id)}</span>
                      {" باید به "}
                      <span className="font-medium">{nameOf(users, t.to_user_id)}</span>
                      {" پرداخت کند"}
                    </div>
                    <div className="font-bold whitespace-nowrap">{formatToman(t.amount)}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ExpenseModal open={openExpense} onClose={() => setOpenExpense(false)} users={users} />
      <PaymentModal open={openPayment} onClose={() => setOpenPayment(false)} users={users} />
    </ProtectedRoute>
  );
}
