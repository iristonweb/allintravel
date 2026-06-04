/** Travel directions for friend circles and discovery filters */

export type TravelDirectionId =
  | "europe"
  | "asia"
  | "america"
  | "africa"
  | "oceania"
  | "middle_east"
  | "local";

export const TRAVEL_DIRECTIONS: { id: TravelDirectionId; label: string }[] = [
  { id: "europe", label: "Европа" },
  { id: "asia", label: "Азия" },
  { id: "america", label: "Америка" },
  { id: "africa", label: "Африка" },
  { id: "oceania", label: "Океания" },
  { id: "middle_east", label: "Ближний Восток" },
  { id: "local", label: "Рядом / по стране" },
];

export const TRAVEL_DIRECTION_IDS = new Set(TRAVEL_DIRECTIONS.map((d) => d.id));

export function isTravelDirectionId(value: string): value is TravelDirectionId {
  return TRAVEL_DIRECTION_IDS.has(value as TravelDirectionId);
}
