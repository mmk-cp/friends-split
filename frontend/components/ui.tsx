"use client";

import React from "react";
import clsx from "clsx";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const base =
    "rounded-xl px-4 py-2 text-sm font-medium transition active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none";
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] shadow-[0_8px_20px_rgba(15,118,110,0.2)]"
      : variant === "secondary"
      ? "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--border)]"
      : variant === "danger"
      ? "bg-[var(--danger)] text-white hover:brightness-95"
      : "bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)]";
  return <button className={clsx(base, styles, className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent)]",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent)]",
        props.className
      )}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-[var(--muted)]">{children}</div>;
}

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "green" | "amber" }) {
  const cls =
    tone === "green"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : tone === "amber"
      ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
      : "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]";
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", cls)}>
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-3">
        <div className="w-full sm:max-w-lg rounded-2xl bg-[var(--surface)] shadow-[var(--shadow)] border border-[var(--border)]">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="font-semibold font-display">{title}</div>
            <button className="text-[var(--muted)] hover:text-[var(--text)]" onClick={onClose} aria-label="close">
              ✕
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
