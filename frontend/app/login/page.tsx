"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useAuth } from "@/store/authStore";
import { apiFetch } from "@/lib/api";
import { Card, Button, Input, Label } from "@/components/ui";
import { useToast } from "@/components/Toast";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";
  const { setAuth } = useAuth();
  const toast = useToast();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tok = await apiFetch<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      await setAuth(tok.access_token);
      const me = await apiFetch<any>("/users/me", { auth: true });
      if (!me.is_approved) router.replace("/waiting-approval");
      else router.replace(next);
    } catch (err: any) {
      toast.push({ type: "error", message: err.message || "خطا در ورود" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md p-6 animate-rise">
        <div className="text-2xl font-display font-semibold">ورود</div>
        <div className="text-sm text-[var(--muted)] mt-1">برای ادامه وارد شوید</div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <Label>نام کاربری</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </div>
          <div>
            <Label>رمز</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" />
          </div>

          <Button className="w-full" disabled={loading || !username || !password}>
            {loading ? "در حال ورود…" : "ورود"}
          </Button>
        </form>

        <div className="mt-4 text-sm text-[var(--muted)]">
          حساب ندارید؟{" "}
          <Link className="text-[var(--text)] font-medium underline" href="/register">
            ثبت‌نام
          </Link>
        </div>
      </Card>
    </div>
  );
}
