/** Shared filter options for list pages */

export type FilterOption = { value: string; label: string };

export const PLACE_TYPE_FILTERS: FilterOption[] = [
  { value: "", label: "Все типы" },
  { value: "restaurant", label: "Рестораны" },
  { value: "hotel", label: "Отели" },
  { value: "attraction", label: "Достопримечательности" },
];

export const PLACE_RATING_FILTERS: FilterOption[] = [
  { value: "", label: "Любой рейтинг" },
  { value: "3", label: "от 3.0" },
  { value: "4", label: "от 4.0" },
  { value: "4.5", label: "от 4.5" },
];

export const PLACE_PRICE_FILTERS: FilterOption[] = [
  { value: "", label: "Любая цена" },
  { value: "$", label: "$" },
  { value: "$$", label: "$$" },
  { value: "$$$", label: "$$$" },
  { value: "$$$$", label: "$$$$" },
];

export const EVENT_TYPE_FILTERS: FilterOption[] = [
  { value: "", label: "Все типы" },
  { value: "festival", label: "Фестивали" },
  { value: "workshop", label: "Воркшопы" },
  { value: "adventure", label: "Приключения" },
  { value: "food", label: "Еда" },
  { value: "music", label: "Музыка" },
  { value: "culture", label: "Культура" },
];

export const EVENT_TIME_FILTERS: FilterOption[] = [
  { value: "upcoming", label: "Предстоящие" },
  { value: "all", label: "Все" },
  { value: "past", label: "Прошедшие" },
];

export const TRIP_AVAILABILITY_FILTERS: FilterOption[] = [
  { value: "", label: "Все поездки" },
  { value: "open", label: "Есть места" },
  { value: "full", label: "Группа полная" },
];

export const HERO_SEARCH_TARGETS: FilterOption[] = [
  { value: "map", label: "На карте" },
  { value: "places", label: "Каталог мест" },
  { value: "trips", label: "Поездки" },
  { value: "events", label: "События" },
  { value: "groups", label: "Группы" },
];

export const HERO_TRAVELER_OPTIONS: FilterOption[] = [
  { value: "", label: "Любое число" },
  { value: "1", label: "1 человек" },
  { value: "2", label: "2 человека" },
  { value: "3-5", label: "3–5 человек" },
  { value: "6+", label: "6 и больше" },
];

export const MAP_PLACE_TYPE_FILTERS: FilterOption[] = [
  { value: "all", label: "Все" },
  { value: "hotel", label: "Отели" },
  { value: "restaurant", label: "Рестораны" },
  { value: "attraction", label: "Активности" },
  { value: "tour", label: "Туры" },
];

export const FEED_MODE_FILTERS: FilterOption[] = [
  { value: "all", label: "Вся лента" },
  { value: "following", label: "Подписки" },
  { value: "nearby", label: "Рядом" },
];

export const FEED_MODE_TAB_FILTERS: FilterOption[] = [
  { value: "all", label: "Все" },
  { value: "following", label: "Подписки" },
  { value: "popular", label: "Популярное" },
];
