"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Card, Button, Badge } from "@/components/ui";
import { useAuth } from "@/store/authStore";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types/user";
import { useToast } from "@/components/Toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();

  React.useEffect(() => {
    if (user && !user.is_admin) router.replace("/dashboard");
  }, [user, router]);

  const pendingQ = useQuery({
    queryKey: ["pendingUsers"],
    queryFn: () => apiFetch<User[]>("/users/pending-approvals", { auth: true }),
    enabled: !!user?.is_admin,
  });

  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<User[]>("/users", { auth: true }),
    enabled: !!user?.is_admin,
  });

  const approve = useMutation({
    mutationFn: async (id: number) =>
      apiFetch<User>(`/users/${id}/approve`, { method: "PATCH", auth: true, body: JSON.stringify({ is_approved: true }) }),
    onSuccess: async () => {
      toast.push({ type: "success", message: "کاربر تایید شد" });
      await qc.invalidateQueries({ queryKey: ["pendingUsers"] });
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.push({ type: "error", message: e.message || "خطا" }),
  });

  const setActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) =>
      apiFetch<User>(`/users/${id}/active`, { method: "PATCH", auth: true, body: JSON.stringify({ is_active }) }),
    onSuccess: async () => {
      toast.push({ type: "success", message: "وضعیت کاربر به‌روزرسانی شد" });
      await qc.invalidateQueries({ queryKey: ["pendingUsers"] });
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.push({ type: "error", message: e.message || "خطا" }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => apiFetch(`/users/${id}`, { method: "DELETE", auth: true }),
    onSuccess: async () => {
      toast.push({ type: "success", message: "کاربر حذف شد" });
      await qc.invalidateQueries({ queryKey: ["pendingUsers"] });
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.push({ type: "error", message: e.message || "خطا" }),
  });

  const pending = pendingQ.data || [];
  const approved = (usersQ.data || []).filter((u) => u.is_approved);

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container-page py-5 pb-24 sm:pb-8 space-y-4">
        <Card className="p-5 animate-rise">
          <div className="text-2xl font-display font-semibold">پنل ادمین</div>
          <div className="text-sm text-[var(--muted)] mt-1">تایید کاربران جدید</div>
        </Card>

        {pendingQ.isLoading ? (
          <div className="text-sm text-[var(--muted)]">در حال دریافت…</div>
        ) : pending.length === 0 ? (
          <Card className="p-4 text-sm text-[var(--muted)]">کاربرِ در انتظار تایید وجود ندارد.</Card>
        ) : (
          <div className="grid gap-3">
            {pending.map((u) => (
              <Card key={u.id} className="p-4 flex items-center justify-between gap-3 animate-rise">
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {u.first_name} {u.last_name} <span className="text-sm text-[var(--muted)]">(@{u.username})</span>
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    <Badge tone="amber">Pending</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => approve.mutate(u.id)} disabled={approve.isPending}>
                    تایید
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (window.confirm("این کاربر تاییدنشده حذف شود؟")) remove.mutate(u.id);
                    }}
                    disabled={remove.isPending}
                  >
                    حذف
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="font-semibold font-display">کاربران تایید شده</div>
          {usersQ.isLoading ? (
            <div className="text-sm text-[var(--muted)]">در حال دریافت…</div>
          ) : approved.length === 0 ? (
            <Card className="p-4 text-sm text-[var(--muted)]">کاربر تایید شده‌ای وجود ندارد.</Card>
          ) : (
            <div className="grid gap-3">
              {approved.map((u) => (
                <Card key={u.id} className="p-4 flex items-center justify-between gap-3 animate-rise">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {u.first_name} {u.last_name} <span className="text-sm text-[var(--muted)]">(@{u.username})</span>
                    </div>
                  <div className="text-xs text-[var(--muted)] mt-1 flex items-center gap-2">
                    <Badge tone="green">Approved</Badge>
                    {!u.is_active && <Badge tone="amber">Inactive</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.is_admin && <Badge tone="amber">Admin</Badge>}
                  {!u.is_admin && (
                    <>
                      {u.is_active ? (
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (window.confirm("این کاربر غیرفعال شود؟")) setActive.mutate({ id: u.id, is_active: false });
                          }}
                          disabled={setActive.isPending}
                        >
                          غیرفعال
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => setActive.mutate({ id: u.id, is_active: true })}
                          disabled={setActive.isPending}
                        >
                          فعال‌سازی
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
