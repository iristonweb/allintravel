/** Built-in public rooms migrated to chat_rooms table */
export const LEGACY_CHAT_ROOM_SEEDS = [
  { slug: "general", title: "Общий", description: "Общий чат путешественников" },
  { slug: "europe", title: "Европа", description: "Обсуждение поездок по Европе" },
  { slug: "asia", title: "Азия", description: "Обсуждение поездок по Азии" },
  { slug: "america", title: "Америка", description: "Обсуждение поездок по Америке" },
  { slug: "tips", title: "Советы", description: "Советы и лайфхаки для путешествий" },
  { slug: "iceland-2024", title: "Исландия 2024", description: "Группа поездки в Исландию" },
] as const;
