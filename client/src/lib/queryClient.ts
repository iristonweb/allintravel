import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { emitAitGrant, extractAitGrantFromBody } from "@/lib/ait-toast";

const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_ORIGIN) || "";

export function toApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = API_BASE.replace(/\/$/, "");
  return base ? `${base}${path.startsWith("/") ? path : `/${path}`}` : path;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let message = text;
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      /* plain text error */
    }
    throw new Error(message);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(toApiUrl(url), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/** Parse JSON and show AIT toast if response includes aitGrant */
export async function apiRequestJson<T = unknown>(
  method: string,
  url: string,
  data?: unknown,
): Promise<T> {
  const res = await apiRequest(method, url, data);
  const text = await res.text();
  if (!text) return {} as T;
  const body = JSON.parse(text) as T;
  emitAitGrant(extractAitGrantFromBody(body));
  return body;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    if (queryKey.length > 1 && typeof queryKey[1] === "object" && queryKey[1] !== null) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryKey[1] as Record<string, unknown>)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url = `${url}?${qs}`;
    } else if (queryKey.length > 1) {
      url = queryKey.join("/");
    }
    const res = await fetch(toApiUrl(url), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
