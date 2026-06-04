declare global {
  interface Window {
    // Yandex Maps JS API 2.1 (loaded dynamically)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ymaps?: any;
  }
}

let loadPromise: Promise<void> | null = null;

export function loadYandexMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Yandex Maps only runs in browser"));
  }

  if (window.ymaps) {
    return new Promise((resolve) => window.ymaps!.ready(resolve));
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ait-yandex-maps="1"]');
    if (existing) {
      existing.addEventListener("load", () => window.ymaps?.ready(() => resolve()));
      existing.addEventListener("error", () => reject(new Error("Yandex Maps script failed")));
      return;
    }

    const script = document.createElement("script");
    script.dataset.aitYandexMaps = "1";
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      if (!window.ymaps) {
        reject(new Error("ymaps not available after load"));
        return;
      }
      window.ymaps.ready(() => resolve());
    };
    script.onerror = () => reject(new Error("Failed to load Yandex Maps JS API"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
