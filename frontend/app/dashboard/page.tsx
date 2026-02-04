"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Card, Button, Badge } from "@/components/ui";
import MonthPicker from "@/components/MonthPicker";
import ExpenseModal from "@/components/ExpenseModal";
import PaymentModal from "@/components/PaymentModal";
import ExpenseCard from "@/components/ExpenseCard";
import { todayJalaliYearMonth, jalaliMonthName, formatJalaliDate } from "@/lib/jalali";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/store/authStore";
import { formatToman } from "@/lib/format";
import type { User } from "@/types/user";
import type { Expense } from "@/types/expense";
import type { Payment } from "@/types/payment";
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

  const paymentsQ = useQuery({
    queryKey: ["payments", year, month],
    queryFn: () => apiFetch<Payment[]>(`/payments?shamsi_year=${year}&shamsi_month=${month}`, { auth: true }),
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
  const payments = paymentsQ.data || [];
  const pending = pendingQ.data || [];
  const settlement = settleQ.data;
  const myBalances = (settlement?.my_balances || []).slice().sort((a, b) => Math.abs(Number(b.balance)) - Math.abs(Number(a.balance)));
  const myTotal = myBalances.reduce((acc, b) => acc + Number(b.balance), 0);
  const myTotalAbs = Math.abs(myTotal);
  const myTotalLabel = myTotal > 0 ? "طلبکار" : myTotal < 0 ? "بدهکار" : "تسویه";

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container-page py-5 pb-24 sm:pb-8 space-y-4">
        <Card className="p-5 animate-rise">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-2xl font-display font-semibold">داشبورد</div>
              <div className="text-sm text-[var(--muted)] mt-1">
                ماه انتخاب‌شده: {jalaliMonthName(month)} {year}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => setOpenExpense(true)}>ثبت هزینه</Button>
                <Button variant="secondary" onClick={() => setOpenPayment(true)}>
                  ثبت پرداخت
                </Button>
              </div>
            </div>

            <div className="surface-soft rounded-2xl p-4 min-w-[220px]">
              <div className="text-xs text-[var(--muted)]">جمع وضعیت من</div>
              <div className="text-xl font-display mt-1">
                {myTotalAbs > 0 ? formatToman(myTotalAbs) : "۰ تومان"}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                وضعیت: <span className="text-[var(--text)] font-medium">{myTotalLabel}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
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
            <div className="font-semibold font-display">در انتظار تایید شما</div>
            <div className="grid gap-3">
              {pending.map((e, idx) => (
                <div key={e.id} className="animate-rise" style={{ animationDelay: `${idx * 40}ms` }}>
                  <ExpenseCard expense={e} users={users} myId={user!.id} isAdmin={!!user?.is_admin} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses list */}
        <div className="space-y-3">
          <div className="font-semibold font-display">هزینه‌های این ماه</div>
          {expensesQ.isLoading ? (
            <div className="text-sm text-[var(--muted)]">در حال دریافت…</div>
          ) : expenses.length === 0 ? (
            <Card className="p-4 text-sm text-[var(--muted)]">هنوز هزینه‌ای ثبت نشده است.</Card>
          ) : (
            <div className="grid gap-3">
              {expenses.map((e, idx) => (
                <div key={e.id} className="animate-rise" style={{ animationDelay: `${idx * 40}ms` }}>
                  <ExpenseCard expense={e} users={users} myId={user!.id} isAdmin={!!user?.is_admin} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments list */}
        <div className="space-y-3">
          <div className="font-semibold font-display">پرداخت‌های این ماه</div>
          {paymentsQ.isLoading ? (
            <div className="text-sm text-[var(--muted)]">در حال دریافت…</div>
          ) : payments.length === 0 ? (
            <Card className="p-4 text-sm text-[var(--muted)]">پرداختی در این ماه ثبت نشده است.</Card>
          ) : (
            <div className="grid gap-3">
              {payments.map((p, idx) => (
                <Card key={p.id} className="p-4 animate-rise" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">
                        {nameOf(users, p.from_user_id)} {"→"} {nameOf(users, p.to_user_id)}
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1">
                        تاریخ: {formatJalaliDate(p.payment_date)} {p.description ? `• ${p.description}` : ""}
                      </div>
                    </div>
                    <div className="font-bold whitespace-nowrap">{formatToman(p.amount)}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Settlement */}
        <div id="settlement" className="space-y-3 scroll-mt-24">
          <div className="font-semibold font-display">تسویه تا پایان این ماه</div>
          {settleQ.isLoading ? (
            <div className="text-sm text-[var(--muted)]">در حال محاسبه…</div>
          ) : !settlement ? (
            <Card className="p-4 text-sm text-[var(--muted)]">اطلاعات تسویه در دسترس نیست.</Card>
          ) : (
            <div className="space-y-3">
              <Card className="p-4">
                <div className="font-medium font-display mb-2">حساب من با هر نفر</div>
                {myBalances.length === 0 ? (
                  <div className="text-sm text-[var(--muted)]">حساب شما با همه تسویه است.</div>
                ) : (
                  <div className="space-y-2">
                    {myBalances.map((b) => {
                      const amount = Number(b.balance);
                      const abs = Math.abs(amount);
                      const other = nameOf(users, b.user_id);
                      return (
                        <div key={b.user_id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            {amount >= 0 ? (
                              <>
                                <span className="font-medium">{other}</span>
                                {" باید به شما پرداخت کند"}
                              </>
                            ) : (
                              <>
                                {"شما باید به "}
                                <span className="font-medium">{other}</span>
                                {" پرداخت کنید"}
                              </>
                            )}
                          </div>
                          <div className="font-bold whitespace-nowrap">{formatToman(abs)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-2 text-xs text-[var(--muted)]">
                  محاسبه بر اساس هزینه‌های تاییدشده و پرداخت‌های ثبت‌شده تا پایان این ماه است.
                </div>
              </Card>

              <Card className="p-4">
                <div className="font-medium font-display mb-2">تراکنش‌های پیشنهادی برای تسویه گروه</div>
                {settlement.transfers.length === 0 ? (
                  <div className="text-sm text-[var(--muted)]">تراکنش پیشنهادی برای تسویه وجود ندارد.</div>
                ) : (
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
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      <ExpenseModal open={openExpense} onClose={() => setOpenExpense(false)} users={users} />
      <PaymentModal open={openPayment} onClose={() => setOpenPayment(false)} users={users} />
    </ProtectedRoute>
  );
}
