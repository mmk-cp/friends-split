"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/store/authStore";

const nav = [
  { href: "/dashboard", label: "داشبورد", icon: "🏠" },
  { href: "/dashboard#settlement", label: "تسویه", icon: "🧾" },
  { href: "/admin", label: "ادمین", icon: "🛡️", admin: true },
];

export default function Navbar() {
  const path = usePathname();
  const { user, logout } = useAuth();

  const items = nav.filter((n) => !n.admin || user?.is_admin);

  return (
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="container-page py-3 flex items-center justify-between">
          <div className="font-bold">Friends Split</div>
          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden sm:block text-xs text-slate-600">
                {user.first_name} {user.last_name} {user.is_admin ? "(Admin)" : ""}
              </div>
            )}
            {user && (
              <button onClick={logout} className="text-xs px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200">
                خروج
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 sm:hidden">
          <div className="container-page py-2 grid grid-cols-3 gap-1">
            {items.slice(0, 3).map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-xs",
                  path.startsWith(it.href.split("#")[0]) ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-800"
                )}
              >
                <div className="text-base">{it.icon}</div>
                <div>{it.label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
