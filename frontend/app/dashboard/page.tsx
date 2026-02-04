"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Card, Button, Badge, Input } from "@/components/ui";
import MonthPicker from "@/components/MonthPicker";
import ExpenseModal from "@/components/ExpenseModal";
import PaymentModal from "@/components/PaymentModal";
import ExpenseCard from "@/components/ExpenseCard";
import { todayJalaliYearMonth, jalaliMonthName, formatJalaliDate } from "@/lib/jalali";
import { apiFetch, apiFetchWithMeta } from "@/lib/api";
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

type PagedResult<T> = {
  items: T[];
  total: number;
  totalPages: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const initial = React.useMemo(() => todayJalaliYearMonth(), []);
  const [year, setYear] = React.useState(initial.year);
  const [month, setMonth] = React.useState(initial.month);
  const [scope, setScope] = React.useState<"mine" | "all">("mine");
  const [scopeTouched, setScopeTouched] = React.useState(false);

  const [openExpense, setOpenExpense] = React.useState(false);
  const [openPayment, setOpenPayment] = React.useState(false);
  const [expenseQuery, setExpenseQuery] = React.useState("");
  const [expensePage, setExpensePage] = React.useState(1);
  const [paymentPage, setPaymentPage] = React.useState(1);
  const [balancePage, setBalancePage] = React.useState(1);
  const [transferQuery, setTransferQuery] = React.useState("");
  const [transferPage, setTransferPage] = React.useState(1);
  const perPage = 10;

  const buildParams = React.useCallback((params: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === null) return;
      sp.set(key, String(value));
    });
    return sp.toString();
  }, []);

  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<User[]>("/users", { auth: true }),
  });

  const expensesQ = useQuery({
    queryKey: ["expenses", year, month, scope, expenseQuery, expensePage],
    queryFn: async () => {
      const qs = buildParams({
        shamsi_year: year,
        shamsi_month: month,
        scope,
        q: expenseQuery.trim(),
        page: expensePage,
        per_page: perPage,
      });
      const res = await apiFetchWithMeta<Expense[]>(`/expenses?${qs}`, { auth: true });
      const total = Number(res.headers.get("x-total-count") || 0);
      const totalPages = Number(res.headers.get("x-total-pages") || 1);
      return { items: res.data, total, totalPages } as PagedResult<Expense>;
    },
    enabled: !!user,
  });

  const paymentsQ = useQuery({
    queryKey: ["payments", year, month, scope, paymentPage],
    queryFn: async () => {
      const qs = buildParams({
        shamsi_year: year,
        shamsi_month: month,
        scope,
        page: paymentPage,
        per_page: perPage,
      });
      const res = await apiFetchWithMeta<Payment[]>(`/payments?${qs}`, { auth: true });
      const total = Number(res.headers.get("x-total-count") || 0);
      const totalPages = Number(res.headers.get("x-total-pages") || 1);
      return { items: res.data, total, totalPages } as PagedResult<Payment>;
    },
    enabled: !!user,
  });

  const pendingQ = useQuery({
    queryKey: ["pendingApprovals"],
    queryFn: () => apiFetch<Expense[]>("/expenses/pending-my-approvals", { auth: true }),
    enabled: !!user,
  });

  const settleQ = useQuery({
    queryKey: ["settlement", year, month, scope],
    queryFn: () => apiFetch<SettlementReport>(`/settlements?shamsi_year=${year}&shamsi_month=${month}&scope=${scope}`, { auth: true }),
    enabled: !!user,
  });

  const users = usersQ.data || [];
  const expenses = expensesQ.data?.items || [];
  const payments = paymentsQ.data?.items || [];
  const pending = pendingQ.data || [];
  const settlement = settleQ.data;
  const myBalances = (settlement?.my_balances || []).slice().sort((a, b) => Math.abs(Number(b.balance)) - Math.abs(Number(a.balance)));
  const myTotal = myBalances.reduce((acc, b) => acc + Number(b.balance), 0);
  const myTotalAbs = Math.abs(myTotal);
  const myTotalLabel = myTotal > 0 ? "طلبکار" : myTotal < 0 ? "بدهکار" : "تسویه";
  const showGroupTransfers = !!user?.is_admin && scope === "all";

  const transfers = settlement?.transfers || [];
  const transferQueryTrim = transferQuery.trim().toLowerCase();
  const filteredTransfers = transfers.filter((t) => {
    if (!transferQueryTrim) return true;
    const fromName = nameOf(users, t.from_user_id).toLowerCase();
    const toName = nameOf(users, t.to_user_id).toLowerCase();
    return fromName.includes(transferQueryTrim) || toName.includes(transferQueryTrim);
  });
  const transferTotalPages = Math.max(1, Math.ceil(filteredTransfers.length / perPage));
  const pagedTransfers = filteredTransfers.slice((transferPage - 1) * perPage, transferPage * perPage);

  const expenseTotalRaw = expensesQ.data?.total ?? expenses.length;
  const expenseTotal = expenseTotalRaw || expenses.length;
  const expenseTotalPages = Math.max(1, (expensesQ.data?.totalPages ?? Math.ceil(expenseTotal / perPage)) || 1);
  const paymentTotalRaw = paymentsQ.data?.total ?? payments.length;
  const paymentTotal = paymentTotalRaw || payments.length;
  const paymentTotalPages = Math.max(1, (paymentsQ.data?.totalPages ?? Math.ceil(paymentTotal / perPage)) || 1);
  const balanceTotalPages = Math.max(1, Math.ceil(myBalances.length / perPage));

  const pagedBalances = myBalances.slice((balancePage - 1) * perPage, balancePage * perPage);

  React.useEffect(() => {
    setExpensePage(1);
  }, [expenseQuery, year, month, scope]);

  React.useEffect(() => {
    setPaymentPage(1);
  }, [year, month, scope]);

  React.useEffect(() => {
    setBalancePage(1);
  }, [year, month, scope]);

  React.useEffect(() => {
    setTransferPage(1);
  }, [transferQuery, year, month, scope]);

  React.useEffect(() => {
    if (expensePage > expenseTotalPages) setExpensePage(expenseTotalPages);
  }, [expensePage, expenseTotalPages]);

  React.useEffect(() => {
    if (paymentPage > paymentTotalPages) setPaymentPage(paymentTotalPages);
  }, [paymentPage, paymentTotalPages]);

  React.useEffect(() => {
    if (transferPage > transferTotalPages) setTransferPage(transferTotalPages);
  }, [transferPage, transferTotalPages]);

  React.useEffect(() => {
    if (!user || scopeTouched) return;
    setScope(user.is_admin ? "all" : "mine");
    setScopeTouched(true);
  }, [user, scopeTouched]);

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
              {user?.is_admin && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant={scope === "all" ? "primary" : "secondary"}
                    onClick={() => {
                      setScope("all");
                      setScopeTouched(true);
                    }}
                  >
                    نمایش همه
                  </Button>
                  <Button
                    variant={scope === "mine" ? "primary" : "secondary"}
                    onClick={() => {
                      setScope("mine");
                      setScopeTouched(true);
                    }}
                  >
                    فقط من
                  </Button>
                </div>
              )}
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
          <Input
            placeholder="جستجو در مبلغ یا توضیحات…"
            value={expenseQuery}
            onChange={(e) => setExpenseQuery(e.target.value)}
          />
          {expensesQ.isLoading && !expensesQ.data ? (
            <div className="text-sm text-[var(--muted)]">در حال دریافت…</div>
          ) : expenseTotal === 0 ? (
            <Card className="p-4 text-sm text-[var(--muted)]">
              {expenseQuery.trim() ? "موردی مطابق جستجو پیدا نشد." : "هنوز هزینه‌ای ثبت نشده است."}
            </Card>
          ) : (
            <>
              <div className="grid gap-3">
                {expenses.map((e, idx) => (
                  <div key={e.id} className="animate-rise" style={{ animationDelay: `${idx * 40}ms` }}>
                    <ExpenseCard expense={e} users={users} myId={user!.id} isAdmin={!!user?.is_admin} />
                  </div>
                ))}
              </div>
              {expenseTotal > perPage && (
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <div>
                    صفحه {expensePage} از {expenseTotalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setExpensePage((p) => Math.max(1, p - 1))} disabled={expensePage === 1}>
                      قبلی
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setExpensePage((p) => Math.min(expenseTotalPages, p + 1))}
                      disabled={expensePage === expenseTotalPages}
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          {expensesQ.isFetching && expensesQ.data && (
            <div className="text-xs text-[var(--muted)]">در حال بروزرسانی…</div>
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
            <div className="space-y-3">
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
              {paymentTotal > perPage && (
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <div>
                    صفحه {paymentPage} از {paymentTotalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setPaymentPage((p) => Math.max(1, p - 1))} disabled={paymentPage === 1}>
                      قبلی
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setPaymentPage((p) => Math.min(paymentTotalPages, p + 1))}
                      disabled={paymentPage === paymentTotalPages}
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              )}
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
                    {pagedBalances.map((b) => {
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
                {myBalances.length > perPage && (
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                    <div>
                      صفحه {balancePage} از {balanceTotalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => setBalancePage((p) => Math.max(1, p - 1))} disabled={balancePage === 1}>
                        قبلی
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setBalancePage((p) => Math.min(balanceTotalPages, p + 1))}
                        disabled={balancePage === balanceTotalPages}
                      >
                        بعدی
                      </Button>
                    </div>
                  </div>
                )}
                <div className="mt-2 text-xs text-[var(--muted)]">
                  محاسبه بر اساس هزینه‌های تاییدشده و پرداخت‌های ثبت‌شده تا پایان این ماه است.
                </div>
              </Card>

              {showGroupTransfers && (
                <Card className="p-4">
                  <div className="font-medium font-display mb-2">تراکنش‌های پیشنهادی برای تسویه گروه</div>
                  <Input
                    placeholder="جستجو بر اساس نام…"
                    value={transferQuery}
                    onChange={(e) => setTransferQuery(e.target.value)}
                  />
                  <div className="mt-3" />
                  {filteredTransfers.length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">تراکنش پیشنهادی برای تسویه وجود ندارد.</div>
                  ) : (
                    <div className="space-y-2">
                      {pagedTransfers.map((t, idx) => (
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
                  {filteredTransfers.length > perPage && (
                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                      <div>
                        صفحه {transferPage} از {transferTotalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={() => setTransferPage((p) => Math.max(1, p - 1))} disabled={transferPage === 1}>
                          قبلی
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setTransferPage((p) => Math.min(transferTotalPages, p + 1))}
                          disabled={transferPage === transferTotalPages}
                        >
                          بعدی
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <ExpenseModal open={openExpense} onClose={() => setOpenExpense(false)} users={users} />
      <PaymentModal open={openPayment} onClose={() => setOpenPayment(false)} users={users} />
    </ProtectedRoute>
  );
}
