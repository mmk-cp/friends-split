import { getToken, clearToken } from "@/lib/auth";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_BASE = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/, "") : undefined;

if (!API_BASE) {
  // eslint-disable-next-line no-console
  console.warn("NEXT_PUBLIC_API_BASE_URL is not set");
}

type FetchOptions = RequestInit & { auth?: boolean };

async function request<T>(path: string, options: FetchOptions = {}): Promise<{ data: T; headers: Headers }> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (options.auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${API_BASE}${normalizedPath}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  let data: any = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) ? (data.detail || data.message) : `HTTP ${res.status}`;
    const err = new Error(msg);
    (err as any).status = res.status;
    (err as any).payload = data;
    throw err;
  }

  return { data: data as T, headers: res.headers };
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const res = await request<T>(path, options);
  return res.data;
}

export async function apiFetchWithMeta<T>(path: string, options: FetchOptions = {}): Promise<{ data: T; headers: Headers }> {
  return request<T>(path, options);
}
