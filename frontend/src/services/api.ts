const RAW_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, "");
const BASE = RAW_URL ? (RAW_URL.endsWith("/api") ? RAW_URL : `${RAW_URL}/api`) : "/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem("life_rpg_token", token);
    else localStorage.removeItem("life_rpg_token");
  } catch {
    // ignore storage restrictions
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem("life_rpg_token");
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      0,
      "Unable to reach the server. The backend may be waking up (please wait ~30 seconds) or check your connection."
    );
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    throw new ApiError(res.status, body?.error || "Something went wrong. Please try again.");
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
