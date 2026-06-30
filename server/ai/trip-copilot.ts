import type { IStorage } from "../storage";
import type { Place } from "@shared/schema";

export type CopilotSuggestion = {
  placeId: string;
  name: string;
  type: string;
  reason: string;
};

export type CopilotResult = {
  summary: string;
  suggestions: CopilotSuggestion[];
  usedAi: boolean;
};

const STYLE_KEYWORDS: Record<string, string[]> = {
  budget: ["бюджет", "дешев", "эконом", "budget", "cheap"],
  luxury: ["люкс", "премиум", "luxury", "vip", "5 звезд"],
  adventure: ["приключ", "трек", "хайк", "adventure", "актив"],
  food: ["еда", "ресторан", "кухн", "food", "гастро"],
  culture: ["музей", "культур", "истор", "culture", "art"],
};

function detectStyles(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(STYLE_KEYWORDS)
    .filter(([, words]) => words.some((w) => lower.includes(w)))
    .map(([k]) => k);
}

async function suggestFromOpenAI(
  prompt: string,
  places: Place[],
): Promise<CopilotSuggestion[] | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const catalog = places.slice(0, 30).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    rating: p.averageRating,
  }));

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            'You are a travel planner. Pick 5-8 place ids from the catalog that best match the user request. Reply JSON only: {"suggestions":[{"placeId":"uuid","reason":"short ru"}]}',
        },
        {
          role: "user",
          content: `Request: ${prompt}\nCatalog: ${JSON.stringify(catalog)}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      suggestions?: { placeId: string; reason: string }[];
    };
    const byId = new Map(places.map((p) => [p.id, p]));
    return (parsed.suggestions ?? [])
      .map((s) => {
        const place = byId.get(s.placeId);
        if (!place) return null;
        return {
          placeId: place.id,
          name: place.name,
          type: place.type,
          reason: s.reason || "Рекомендация AI",
        };
      })
      .filter(Boolean) as CopilotSuggestion[];
  } catch {
    return null;
  }
}

function heuristicSuggestions(prompt: string, places: Place[]): CopilotSuggestion[] {
  const styles = detectStyles(prompt);
  const words = prompt
    .toLowerCase()
    .split(/[\s,;.!?]+/)
    .filter((w) => w.length > 3);

  const scored = places.map((p) => {
    let score = Number(p.averageRating ?? 0);
    const nameLower = p.name.toLowerCase();
    const descLower = (p.description ?? "").toLowerCase();
    for (const w of words) {
      if (nameLower.includes(w) || descLower.includes(w)) score += 2;
    }
    if (styles.includes("food") && p.type === "restaurant") score += 3;
    if (styles.includes("luxury") && p.priceRange === "$$$$") score += 2;
    if (styles.includes("budget") && (p.priceRange === "$" || p.priceRange === "$$")) score += 2;
    if (styles.includes("culture") && p.type === "attraction") score += 2;
    if (styles.includes("adventure") && p.type === "attraction") score += 1;
    return { place: p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ place }) => ({
      placeId: place.id,
      name: place.name,
      type: place.type,
      reason: "Подходит под ваш запрос и рейтинг места",
    }));
}

export async function generateTripCopilotPlan(
  storage: IStorage,
  destination: string,
  prompt: string,
): Promise<CopilotResult> {
  const city = destination.split(",")[0]?.trim() || destination;
  const places = await storage.getPlaces({ search: city, limit: 40 });

  const aiSuggestions = await suggestFromOpenAI(`${destination}. ${prompt}`, places);
  const suggestions = aiSuggestions?.length ? aiSuggestions : heuristicSuggestions(prompt, places);

  const styleNote = detectStyles(prompt).length
    ? ` Стиль: ${detectStyles(prompt).join(", ")}.`
    : "";

  return {
    summary: `Подобрали ${suggestions.length} остановок для «${city}».${styleNote}`,
    suggestions,
    usedAi: Boolean(aiSuggestions?.length),
  };
}
