"use client";

import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/store/authStore";
import { ToastProvider } from "@/components/Toast";
import ThemeManager from "@/components/ThemeManager";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <ThemeManager />
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
