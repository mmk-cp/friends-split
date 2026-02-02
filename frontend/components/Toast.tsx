"use client";

import React from "react";

type Toast = { id: string; type: "success" | "error"; message: string };

const ToastCtx = React.createContext<{
  push: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = (t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, ...t };
    setToasts((p) => [...p, toast]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3500);
  };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed z-50 top-3 left-0 right-0 px-4 flex flex-col gap-2 items-center">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "w-full max-w-md rounded-2xl px-4 py-3 text-sm shadow-[var(--shadow)]",
              t.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white",
            ].join(" ")}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}
