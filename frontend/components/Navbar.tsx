"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import React from "react";
import { useAuth } from "@/store/authStore";
import ThemeToggle from "@/components/ThemeToggle";

const nav = [
  { href: "/dashboard", label: "داشبورد", icon: "🏠" },
  { href: "/admin", label: "ادمین", icon: "🛡️", admin: true },
];

export default function Navbar() {
  const path = usePathname();
  const { user, logout } = useAuth();
  const [hash, setHash] = React.useState("");

  const items = nav.filter((n) => !n.admin || user?.is_admin);
  const hashLinks = items.filter((it) => it.href.includes("#"));
  const hashMatchesNav = hashLinks.some((it) => hash === `#${it.href.split("#")[1]}`);

  React.useEffect(() => {
    const update = () => setHash(window.location.hash || "");
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const isActive = (href: string) => {
    const [base, frag] = href.split("#");
    if (frag) return path.startsWith(base) && hash === `#${frag}`;
    return path.startsWith(base) && !hashMatchesNav;
  };

  return (
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur">
        <div className="container-page py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="font-display text-xl">هم‌حساب</div>
            <div className="hidden sm:block text-xs text-[var(--muted)]">تقسیم هزینه‌ها با آرامش</div>
          </div>

          {user && (
            <nav className="hidden md:flex items-center gap-2">
              {items.map((it) => {
                const active = isActive(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      active
                        ? "border-transparent bg-[var(--accent)] text-white"
                        : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)]"
                    )}
                  >
                    <span>{it.icon}</span>
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="ms-auto flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <div className="hidden sm:block text-xs text-[var(--muted)]">
                {user.first_name} {user.last_name} {user.is_admin ? "(Admin)" : ""}
              </div>
            )}
            {user && (
              <button
                onClick={logout}
                className="text-xs px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface)]"
              >
                خروج
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--surface)] sm:hidden">
          <div className={clsx("container-page py-2 grid gap-2", items.length >= 3 ? "grid-cols-3" : "grid-cols-2")}>
            {items.slice(0, 3).map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-xs border transition",
                  isActive(it.href)
                    ? "border-transparent bg-[var(--accent)] text-white"
                    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]"
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
