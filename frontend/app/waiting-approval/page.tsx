"use client";

import React from "react";
import { Card, Button } from "@/components/ui";
import { useAuth } from "@/store/authStore";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function WaitingApproval() {
  const { refreshMe, user, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const me = await refreshMe();
      if (me?.is_approved) {
        toast.push({ type: "success", message: "حساب شما تایید شد" });
        router.replace("/dashboard");
      } else {
        toast.push({ type: "error", message: "هنوز تایید نشده است" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md p-6 space-y-3 animate-rise">
        <div className="text-2xl font-display font-semibold">در انتظار تایید</div>
        <div className="text-sm text-[var(--muted)]">
          {user ? `${user.first_name} ${user.last_name}` : ""} حساب شما هنوز توسط ادمین تایید نشده است.
        </div>
        <Button onClick={check} disabled={loading}>
          {loading ? "در حال بررسی…" : "بررسی وضعیت"}
        </Button>
        <Button variant="secondary" onClick={logout}>
          خروج
        </Button>
      </Card>
    </div>
  );
}
