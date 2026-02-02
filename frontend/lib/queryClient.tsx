"use client";

import { QueryClient } from "@tanstack/react-query";

let client: QueryClient | null = null;

export function getQueryClient() {
  if (!client) client = new QueryClient();
  return client;
}
