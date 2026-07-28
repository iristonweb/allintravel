/** Bridge wouter/history navigation to `ait:location` for any remaining listeners. */

const EVENT = "ait:location";

let patched = false;

export function ensureHistorySync(): void {
  if (patched || typeof window === "undefined") return;
  patched = true;

  const notify = () => {
    window.dispatchEvent(new CustomEvent(EVENT));
  };

  // Wouter dispatches synthetic "pushState" / "replaceState" events after patching History.
  window.addEventListener("pushState", notify);
  window.addEventListener("replaceState", notify);

  const origPush = window.history.pushState.bind(window.history);
  const origReplace = window.history.replaceState.bind(window.history);

  window.history.pushState = ((...args: Parameters<History["pushState"]>) => {
    const result = origPush(...args);
    notify();
    return result;
  }) as History["pushState"];

  window.history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
    const result = origReplace(...args);
    notify();
    return result;
  }) as History["replaceState"];
}

export function notifyHistoryChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT));
}
