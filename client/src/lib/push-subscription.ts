import { apiRequest } from "@/lib/queryClient";

export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function unsubscribePush(): Promise<void> {
  const sub = await getActivePushSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => undefined);
  if (endpoint) {
    await apiRequest("DELETE", "/api/push/subscribe", { endpoint }).catch(() => undefined);
  }
}
