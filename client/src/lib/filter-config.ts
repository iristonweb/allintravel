/** Shared filter option definitions — labels resolved via useFilterLabels() */

export type FilterOption = { value: string; label: string };
export type FilterOptionDef = { value: string; labelKey: string };

export function translateFilterDefs(
  defs: FilterOptionDef[],
  t: (key: string) => string,
): FilterOption[] {
  return defs.map(({ value, labelKey }) => ({ value, label: t(labelKey) }));
}

export const PLACE_TYPE_FILTER_DEFS: FilterOptionDef[] = [
  { value: "", labelKey: "filters.placeType.all" },
  { value: "restaurant", labelKey: "filters.placeType.restaurant" },
  { value: "hotel", labelKey: "filters.placeType.hotel" },
  { value: "attraction", labelKey: "filters.placeType.attraction" },
];

export const PLACE_RATING_FILTER_DEFS: FilterOptionDef[] = [
  { value: "", labelKey: "filters.rating.any" },
  { value: "3", labelKey: "filters.rating.from3" },
  { value: "4", labelKey: "filters.rating.from4" },
  { value: "4.5", labelKey: "filters.rating.from45" },
];

export const PLACE_PRICE_FILTER_DEFS: FilterOptionDef[] = [
  { value: "", labelKey: "filters.price.any" },
  { value: "$", labelKey: "filters.price.one" },
  { value: "$$", labelKey: "filters.price.two" },
  { value: "$$$", labelKey: "filters.price.three" },
  { value: "$$$$", labelKey: "filters.price.four" },
];

export const EVENT_TYPE_FILTER_DEFS: FilterOptionDef[] = [
  { value: "", labelKey: "filters.eventType.all" },
  { value: "festival", labelKey: "filters.eventType.festival" },
  { value: "workshop", labelKey: "filters.eventType.workshop" },
  { value: "adventure", labelKey: "filters.eventType.adventure" },
  { value: "food", labelKey: "filters.eventType.food" },
  { value: "music", labelKey: "filters.eventType.music" },
  { value: "culture", labelKey: "filters.eventType.culture" },
];

export const EVENT_TIME_FILTER_DEFS: FilterOptionDef[] = [
  { value: "upcoming", labelKey: "filters.eventTime.upcoming" },
  { value: "all", labelKey: "filters.eventTime.all" },
  { value: "past", labelKey: "filters.eventTime.past" },
];

export const TRIP_AVAILABILITY_FILTER_DEFS: FilterOptionDef[] = [
  { value: "", labelKey: "filters.tripAvailability.all" },
  { value: "open", labelKey: "filters.tripAvailability.open" },
  { value: "full", labelKey: "filters.tripAvailability.full" },
];

export const HERO_SEARCH_TARGET_DEFS: FilterOptionDef[] = [
  { value: "map", labelKey: "filters.heroTarget.map" },
  { value: "places", labelKey: "filters.heroTarget.places" },
  { value: "trips", labelKey: "filters.heroTarget.trips" },
  { value: "events", labelKey: "filters.heroTarget.events" },
  { value: "groups", labelKey: "filters.heroTarget.groups" },
];

export const HERO_TRAVELER_DEFS: FilterOptionDef[] = [
  { value: "", labelKey: "filters.travelers.any" },
  { value: "1", labelKey: "filters.travelers.one" },
  { value: "2", labelKey: "filters.travelers.two" },
  { value: "3-5", labelKey: "filters.travelers.threeToFive" },
  { value: "6+", labelKey: "filters.travelers.sixPlus" },
];

export const MAP_PLACE_TYPE_FILTER_DEFS: FilterOptionDef[] = [
  { value: "all", labelKey: "filters.mapType.all" },
  { value: "hotel", labelKey: "filters.mapType.hotel" },
  { value: "restaurant", labelKey: "filters.mapType.restaurant" },
  { value: "attraction", labelKey: "filters.mapType.attraction" },
  { value: "tour", labelKey: "filters.mapType.tour" },
];

export const FEED_MODE_TAB_FILTER_DEFS: FilterOptionDef[] = [
  { value: "all", labelKey: "filters.feedMode.all" },
  { value: "following", labelKey: "filters.feedMode.following" },
  { value: "popular", labelKey: "filters.feedMode.popular" },
  { value: "nearby", labelKey: "filters.feedMode.nearby" },
];
