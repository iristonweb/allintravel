import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  translateFilterDefs,
  PLACE_TYPE_FILTER_DEFS,
  PLACE_RATING_FILTER_DEFS,
  PLACE_PRICE_FILTER_DEFS,
  EVENT_TYPE_FILTER_DEFS,
  EVENT_TIME_FILTER_DEFS,
  TRIP_AVAILABILITY_FILTER_DEFS,
  HERO_SEARCH_TARGET_DEFS,
  HERO_TRAVELER_DEFS,
  MAP_PLACE_TYPE_FILTER_DEFS,
  FEED_MODE_TAB_FILTER_DEFS,
} from "@/lib/filter-config";

export function useFilterLabels() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      placeType: translateFilterDefs(PLACE_TYPE_FILTER_DEFS, t),
      placeRating: translateFilterDefs(PLACE_RATING_FILTER_DEFS, t),
      placePrice: translateFilterDefs(PLACE_PRICE_FILTER_DEFS, t),
      eventType: translateFilterDefs(EVENT_TYPE_FILTER_DEFS, t),
      eventTime: translateFilterDefs(EVENT_TIME_FILTER_DEFS, t),
      tripAvailability: translateFilterDefs(TRIP_AVAILABILITY_FILTER_DEFS, t),
      heroSearchTargets: translateFilterDefs(HERO_SEARCH_TARGET_DEFS, t),
      heroTravelers: translateFilterDefs(HERO_TRAVELER_DEFS, t),
      mapPlaceType: translateFilterDefs(MAP_PLACE_TYPE_FILTER_DEFS, t),
      feedModeTabs: translateFilterDefs(FEED_MODE_TAB_FILTER_DEFS, t),
    }),
    [t],
  );
}
