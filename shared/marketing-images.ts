/** Public marketing image paths (served from client/public/marketing) */

export const HERO_MAIN_SRC = "/marketing/hero-main.jpg";

export const DEST_BALI_SRC = "/marketing/dest-bali.jpg";
export const DEST_ICELAND_SRC = "/marketing/dest-iceland.jpg";
export const DEST_PERU_SRC = "/marketing/dest-peru.jpg";
export const DEST_ITALY_SRC = "/marketing/dest-italy.jpg";
export const DEST_JAPAN_SRC = "/marketing/dest-japan.jpg";
export const DEST_NORWAY_SRC = "/marketing/dest-norway.jpg";

export const COMMUNITY_TRAVEL_SRC = "/marketing/community-travel.jpg";

export const PLACE_CARD_FALLBACK_SRC = DEST_ITALY_SRC;
export const EVENT_CARD_FALLBACK_SRC = DEST_JAPAN_SRC;
export const TRIP_CARD_FALLBACK_SRC = DEST_ICELAND_SRC;

export const SHOWCASE_DESTINATIONS = [
  { id: "bali", name: "Бали", imageUrl: DEST_BALI_SRC, placesCount: 342, rating: 4.8 },
  { id: "iceland", name: "Исландия", imageUrl: DEST_ICELAND_SRC, placesCount: 128, rating: 4.9 },
  { id: "peru", name: "Перу", imageUrl: DEST_PERU_SRC, placesCount: 156, rating: 4.7 },
  { id: "italy", name: "Италия", imageUrl: DEST_ITALY_SRC, placesCount: 412, rating: 4.9 },
  { id: "japan", name: "Япония", imageUrl: DEST_JAPAN_SRC, placesCount: 276, rating: 4.9 },
] as const;

export const MAP_SHOWCASE_DESTINATIONS = [
  { id: "bali", name: "Бали", imageUrl: DEST_BALI_SRC, placesCount: 342, rating: 4.8 },
  { id: "iceland", name: "Исландия", imageUrl: DEST_ICELAND_SRC, placesCount: 128, rating: 4.9 },
  { id: "norway", name: "Норвегия", imageUrl: DEST_NORWAY_SRC, placesCount: 96, rating: 4.8 },
  { id: "japan", name: "Япония", imageUrl: DEST_JAPAN_SRC, placesCount: 276, rating: 4.9 },
] as const;

export const DEMO_PLANNER_DAYS = [
  { day: 1, title: "Рейкьявик", image: DEST_ICELAND_SRC },
  { day: 2, title: "Золотое кольцо", image: DEST_NORWAY_SRC },
  { day: 3, title: "Южный берег", image: DEST_PERU_SRC },
  { day: 4, title: "Лагуна Йёкюльсаурлон", image: DEST_ICELAND_SRC },
] as const;
