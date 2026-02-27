"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Card, Button, Input, Label } from "@/components/ui";
import { useAuth } from "@/store/authStore";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useMutation } from "@tanstack/react-query";

export default function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  const changePassword = useMutation({
    mutationFn: async () => {
      const body = {
        current_password: current,
        new_password: next,
      };
      return apiFetch("/users/me/password", { method: "POST", auth: true, body: JSON.stringify(body) });
    },
    onSuccess: () => {
      toast.push({ type: "success", message: "رمز عبور با موفقیت تغییر کرد" });
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e: any) => toast.push({ type: "error", message: e.message || "خطا در تغییر رمز" }),
  });

  const canSubmit =
    current.length >= 6 &&
    next.length >= 6 &&
    next === confirm &&
    next !== current &&
    !changePassword.isPending;

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container-page py-5 pb-24 sm:pb-8 space-y-4">
        <Card className="p-5">
          <div className="text-2xl font-display font-semibold">حساب کاربری</div>
          <div className="text-sm text-[var(--muted)] mt-1">اطلاعات حساب و امنیت</div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="font-semibold font-display mb-3">اطلاعات پایه</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">نام</span>
                <span className="font-medium">{user ? `${user.first_name} ${user.last_name}` : "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">نام کاربری</span>
                <span className="font-medium">{user ? `@${user.username}` : "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">نقش</span>
                <span className="font-medium">{user?.is_admin ? "ادمین" : "کاربر"}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="font-semibold font-display mb-3">تغییر رمز عبور</div>
            <div className="space-y-3">
              <div>
                <Label>رمز فعلی</Label>
                <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="******" />
              </div>
              <div>
                <Label>رمز جدید</Label>
                <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="حداقل ۶ کاراکتر" />
              </div>
              <div>
                <Label>تکرار رمز جدید</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="تکرار رمز جدید" />
              </div>
              {next && confirm && next !== confirm && (
                <div className="text-xs text-rose-600">رمز جدید و تکرار آن یکسان نیستند.</div>
              )}
              {next && current && next === current && (
                <div className="text-xs text-amber-600">رمز جدید باید با رمز فعلی متفاوت باشد.</div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCurrent("");
                    setNext("");
                    setConfirm("");
                  }}
                  className="flex-1"
                  type="button"
                >
                  پاک کردن
                </Button>
                <Button onClick={() => changePassword.mutate()} disabled={!canSubmit} className="flex-1">
                  تغییر رمز
                </Button>
              </div>
              <div className="text-xs text-[var(--muted)]">بعد از تغییر رمز، حساب شما همچنان فعال می‌ماند.</div>
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
