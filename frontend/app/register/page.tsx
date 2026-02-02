"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { apiFetch } from "@/lib/api";
import { Card, Button, Input, Label } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();

  const [first, setFirst] = React.useState("");
  const [last, setLast] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await apiFetch<any>("/users", {
        method: "POST",
        body: JSON.stringify({ first_name: first, last_name: last, username, password }),
      });
      if (user.is_admin) {
        toast.push({ type: "success", message: "ثبت‌نام انجام شد. شما ادمین هستید. حالا وارد شوید." });
        router.replace("/login");
      } else {
        toast.push({ type: "success", message: "ثبت‌نام انجام شد. منتظر تایید ادمین باشید." });
        router.replace("/login");
      }
    } catch (err: any) {
      toast.push({ type: "error", message: err.message || "خطا در ثبت‌نام" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="text-xl font-bold">ثبت‌نام</div>
        <div className="text-sm text-slate-600 mt-1">حساب جدید بسازید</div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>نام</Label>
              <Input value={first} onChange={(e) => setFirst(e.target.value)} />
            </div>
            <div>
              <Label>نام خانوادگی</Label>
              <Input value={last} onChange={(e) => setLast(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>نام کاربری</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </div>
          <div>
            <Label>رمز</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" />
          </div>

          <Button className="w-full" disabled={loading || !first || !last || username.length < 3 || password.length < 6}>
            {loading ? "در حال ثبت…" : "ثبت‌نام"}
          </Button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          حساب دارید؟{" "}
          <Link className="text-slate-900 font-medium underline" href="/login">
            ورود
          </Link>
        </div>
      </Card>
    </div>
  );
}
