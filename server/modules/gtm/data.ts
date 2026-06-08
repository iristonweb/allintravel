export type NomadHub = {
  slug: string;
  city: string;
  country: string;
  countryCode: string;
  tagline: string;
  nomadScore: number;
  avgRentUsd: number;
  timezone: string;
  highlights: string[];
  imageQuery: string;
};

export const NOMAD_HUBS: NomadHub[] = [
  {
    slug: "lisbon",
    city: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    tagline: "Sun, surf, and startup energy",
    nomadScore: 92,
    avgRentUsd: 1200,
    timezone: "WET",
    highlights: ["NIF for freelancers", "Mild winters", "Strong nomad community"],
    imageQuery: "lisbon tram sunset",
  },
  {
    slug: "bali",
    city: "Canggu",
    country: "Indonesia",
    countryCode: "ID",
    tagline: "Tropical coworking paradise",
    nomadScore: 88,
    avgRentUsd: 900,
    timezone: "WITA",
    highlights: ["Affordable villas", "Surf breaks", "BIV visa options"],
    imageQuery: "bali rice terrace",
  },
  {
    slug: "mexico-city",
    city: "Mexico City",
    country: "Mexico",
    countryCode: "MX",
    tagline: "Culture, food, and fast Wi-Fi",
    nomadScore: 86,
    avgRentUsd: 1100,
    timezone: "CST",
    highlights: ["World-class food", "Art scene", "Direct US flights"],
    imageQuery: "mexico city skyline",
  },
  {
    slug: "berlin",
    city: "Berlin",
    country: "Germany",
    countryCode: "DE",
    tagline: "Europe's creative capital",
    nomadScore: 84,
    avgRentUsd: 1400,
    timezone: "CET",
    highlights: ["Freelance visa path", "Nightlife", "Green spaces"],
    imageQuery: "berlin tv tower",
  },
  {
    slug: "chiang-mai",
    city: "Chiang Mai",
    country: "Thailand",
    countryCode: "TH",
    tagline: "Original digital nomad hub",
    nomadScore: 90,
    avgRentUsd: 700,
    timezone: "ICT",
    highlights: ["Low cost", "Temple culture", "Nomad Summit"],
    imageQuery: "chiang mai temple",
  },
  {
    slug: "dubai",
    city: "Dubai",
    country: "UAE",
    countryCode: "AE",
    tagline: "Tax-free remote work base",
    nomadScore: 82,
    avgRentUsd: 2200,
    timezone: "GST",
    highlights: ["Remote work visa", "Safety", "Global hub"],
    imageQuery: "dubai marina",
  },
];

export type CreatorPerk = {
  id: string;
  title: string;
  description: string;
};

export const CREATOR_PERKS: CreatorPerk[] = [
  { id: "routes", title: "Sell premium routes", description: "15% platform fee, Stripe Connect payouts" },
  { id: "guides", title: "Publish destination guides", description: "SEO pages + affiliate revenue share" },
  { id: "fund", title: "Creator fund", description: "Monthly AIT pool for top contributors" },
  { id: "boost", title: "Post boosts", description: "Promote content to the travel feed" },
];
