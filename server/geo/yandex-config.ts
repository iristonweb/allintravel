/** Yandex Maps API keys — never commit real values; set in .env / Vercel */

const LEGACY = () => process.env.YANDEX_GEOCODER_API_KEY?.trim();

/** Геосаджест — suggest-maps.yandex.ru */
export function getYandexGeosuggestKey(): string | undefined {
  return process.env.YANDEX_GEOSUGGEST_API_KEY?.trim() || LEGACY() || undefined;
}

/** HTTP Геокодер — geocode-maps.yandex.ru (поиск / уточнение координат) */
export function getYandexGeocoderKey(): string | undefined {
  return process.env.YANDEX_GEOCODER_API_KEY?.trim() || LEGACY() || undefined;
}

/** Маршрутизация — api.routing.yandex.net */
export function getYandexRouterKey(): string | undefined {
  return process.env.YANDEX_ROUTER_API_KEY?.trim() || undefined;
}

export function isYandexGeosuggestConfigured(): boolean {
  return !!getYandexGeosuggestKey();
}

export function isYandexGeocoderConfigured(): boolean {
  return !!getYandexGeocoderKey();
}

export function isYandexRouterConfigured(): boolean {
  return !!getYandexRouterKey();
}

export function isAnyYandexGeoConfigured(): boolean {
  return isYandexGeosuggestConfigured() || isYandexGeocoderConfigured();
}
