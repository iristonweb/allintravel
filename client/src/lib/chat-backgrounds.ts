export type ChatBackgroundId =
  | "default"
  | "aurora"
  | "ocean"
  | "sunset"
  | "forest"
  | "midnight"
  | "lavender";

export type ChatBackgroundPreset = {
  id: ChatBackgroundId;
  label: string;
  preview: string;
  threadClass: string;
};

export const CHAT_BACKGROUND_PRESETS: ChatBackgroundPreset[] = [
  {
    id: "default",
    label: "Стандарт",
    preview: "linear-gradient(135deg, #1a1033 0%, #0d1117 100%)",
    threadClass: "ait-chat-thread",
  },
  {
    id: "aurora",
    label: "Аврора",
    preview: "linear-gradient(135deg, #0f172a 0%, #312e81 50%, #064e3b 100%)",
    threadClass: "ait-chat-bg-aurora",
  },
  {
    id: "ocean",
    label: "Океан",
    preview: "linear-gradient(135deg, #0c4a6e 0%, #082f49 50%, #0f172a 100%)",
    threadClass: "ait-chat-bg-ocean",
  },
  {
    id: "sunset",
    label: "Закат",
    preview: "linear-gradient(135deg, #431407 0%, #7c2d12 50%, #1e1b4b 100%)",
    threadClass: "ait-chat-bg-sunset",
  },
  {
    id: "forest",
    label: "Лес",
    preview: "linear-gradient(135deg, #14532d 0%, #052e16 50%, #0f172a 100%)",
    threadClass: "ait-chat-bg-forest",
  },
  {
    id: "midnight",
    label: "Полночь",
    preview: "linear-gradient(135deg, #020617 0%, #1e1b4b 100%)",
    threadClass: "ait-chat-bg-midnight",
  },
  {
    id: "lavender",
    label: "Лаванда",
    preview: "linear-gradient(135deg, #3b0764 0%, #581c87 50%, #1e1b4b 100%)",
    threadClass: "ait-chat-bg-lavender",
  },
];

export function getChatBackgroundClass(id?: string | null): string {
  const preset = CHAT_BACKGROUND_PRESETS.find((p) => p.id === id);
  return preset?.threadClass ?? CHAT_BACKGROUND_PRESETS[0].threadClass;
}
