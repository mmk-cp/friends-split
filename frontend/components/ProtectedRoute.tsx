"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/authStore";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const path = usePathname();

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(path)}`);
      return;
    }
    if (!user.is_approved) {
      router.replace("/waiting-approval");
      return;
    }
  }, [loading, user, router, path]);

  if (loading) return <div className="container-page py-10 text-sm text-slate-600">Loading…</div>;
  if (!user) return null;
  if (!user.is_approved) return null;
  return <>{children}</>;
}
