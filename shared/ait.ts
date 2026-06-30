/** All In Travel — internal reward currency (not crypto). */

export type AitWallet = "spend" | "creator";

/** Returned in API responses as `aitGrant` for client toasts */
export type AitGrantResult = {
  granted: boolean;
  amount: number;
  wallet: AitWallet;
  title: string;
  reason: AitReasonCode;
};

export type AitReasonCode =
  | "welcome"
  | "daily_login"
  | "presence_pulse"
  | "profile_complete"
  | "post_text"
  | "post_media"
  | "post_story"
  | "post_reel"
  | "post_journal"
  | "comment"
  | "chat_message"
  | "chat_message_media"
  | "dm_message"
  | "review"
  | "review_photo"
  | "friend_accepted"
  | "follow"
  | "event_register"
  | "music_upload"
  | "chat_room_created"
  | "trip_created"
  | "like_received"
  | "comment_received"
  | "chat_like_received"
  | "tip_sent"
  | "tip_received"
  | "quest_weekly"
  | "rings_weekly"
  | "spend_shop"
  | "trip_cinema_watch"
  | "trip_checkin"
  | "referral_inviter"
  | "referral_joined"
  | "referral_milestone"
  | "streak_bonus"
  | "streak_freeze"
  | "fog_share"
  | "creator_fund_payout"
  | "admin_adjust";

/** Platform launch for emission cap tiers */
export const AIT_PLATFORM_LAUNCH_DATE = "2025-06-01";

export function getDailyEmissionCap(platformAgeMonths: number): number {
  if (platformAgeMonths < 6) return 100_000;
  if (platformAgeMonths < 12) return 75_000;
  if (platformAgeMonths < 24) return 50_000;
  return 25_000;
}

export const AIT_BURN_RATES = {
  boost: 0.1,
  tip: 0.02,
  marketplace: 0.05,
} as const;

export const AIT_REFERRAL_REWARD = 50;

export type ReferralMilestoneId =
  | "signup"
  | "email_verified"
  | "profile_complete"
  | "first_post"
  | "active_7d"
  | "active_30d";

export const AIT_REFERRAL_MILESTONES: Record<ReferralMilestoneId, number> = {
  signup: 50,
  email_verified: 20,
  profile_complete: 30,
  first_post: 50,
  active_7d: 100,
  active_30d: 200,
};

export const AIT_STREAK_BONUSES: { minDays: number; bonus: number }[] = [
  { minDays: 90, bonus: 50 },
  { minDays: 60, bonus: 20 },
  { minDays: 30, bonus: 10 },
  { minDays: 14, bonus: 5 },
  { minDays: 7, bonus: 2 },
  { minDays: 1, bonus: 1 },
];

export function resolveStreakBonus(streakDays: number): number {
  for (const tier of AIT_STREAK_BONUSES) {
    if (streakDays >= tier.minDays) return tier.bonus;
  }
  return 0;
}

export const AIT_STREAK_FREEZE_COST = 100;
export const AIT_STREAK_FREEZE_MAX_PER_MONTH = 3;
export const AIT_FOG_SHARE_REWARD = 25;

export const WORLD_COUNTRY_COUNT = 195;

/** Monthly Creator Fund pool (AIT) */
export const CREATOR_FUND_MONTHLY_POOL = 50_000;
export const CREATOR_FUND_MIN_LIFETIME = 500;

export type ActivityRingId = "voice" | "story" | "echo" | "pulse";

export const RING_LABELS: Record<ActivityRingId, string> = {
  voice: "Голос",
  story: "История",
  echo: "Отклик",
  pulse: "Пульс",
};

/** Spend-wallet rewards — initial supply 0 (no welcome grant) */
export const AIT_REWARDS: Partial<Record<AitReasonCode, number>> = {
  welcome: 0,
  daily_login: 5,
  presence_pulse: 3,
  profile_complete: 50,
  post_text: 15,
  post_media: 25,
  post_story: 20,
  post_reel: 35,
  post_journal: 30,
  comment: 8,
  chat_message: 6,
  chat_message_media: 12,
  dm_message: 4,
  review: 25,
  review_photo: 40,
  friend_accepted: 20,
  follow: 3,
  event_register: 15,
  music_upload: 15,
  chat_room_created: 40,
  trip_created: 30,
  trip_cinema_watch: 20,
  trip_checkin: 12,
  referral_inviter: AIT_REFERRAL_REWARD,
  referral_joined: AIT_REFERRAL_REWARD,
  referral_milestone: 0,
  streak_bonus: 0,
  streak_freeze: 0,
  fog_share: AIT_FOG_SHARE_REWARD,
  quest_weekly: 100,
  rings_weekly: 120,
};

/** Creator-wallet rewards (audience → author) */
export const AIT_CREATOR_REWARDS: Partial<Record<AitReasonCode, number>> = {
  like_received: 1,
  comment_received: 1,
  chat_like_received: 1,
  creator_fund_payout: 0,
};

export const AIT_DAILY_CAPS: Partial<Record<AitReasonCode, number>> = {
  daily_login: 1,
  presence_pulse: 1,
  post_text: 5,
  post_media: 5,
  post_story: 6,
  post_reel: 3,
  post_journal: 3,
  comment: 30,
  chat_message: 50,
  chat_message_media: 10,
  dm_message: 50,
  follow: 15,
  like_received: 50,
  comment_received: 30,
  chat_like_received: 50,
  tip_received: 500,
  trip_cinema_watch: 3,
  trip_checkin: 1,
  referral_inviter: 20,
  referral_joined: 1,
  referral_milestone: 30,
  fog_share: 1,
  streak_bonus: 1,
};

export type AitCatalogItem = {
  sku: string;
  title: string;
  description: string;
  cost: number;
  category: "theme" | "social" | "utility" | "creator";
  durationDays: number | null;
  meta?: Record<string, string>;
};

export const AIT_BOOST_BASE_COST = 200;
export const AIT_BOOST_MAX_PER_DAY = 3;

export const AIT_CATALOG: AitCatalogItem[] = [
  {
    sku: "theme_aurora",
    title: "Тема Aurora",
    description: "Северное сияние — фиолетово-бирюзовый градиент интерфейса",
    cost: 400,
    category: "theme",
    durationDays: null,
    meta: { themeId: "aurora" },
  },
  {
    sku: "theme_sakura",
    title: "Тема Sakura Night",
    description: "Мягкий розово-лиловый акцент для ленты и профиля",
    cost: 450,
    category: "theme",
    durationDays: null,
    meta: { themeId: "sakura" },
  },
  {
    sku: "theme_desert",
    title: "Тема Desert Sun",
    description: "Тёплый закатный оранжевый glow",
    cost: 350,
    category: "theme",
    durationDays: null,
    meta: { themeId: "desert" },
  },
  {
    sku: "boost_post_24h",
    title: "Boost поста 24ч",
    description: "Умное продвижение с учётом качества и опыта",
    cost: AIT_BOOST_BASE_COST,
    category: "social",
    durationDays: 1,
  },
  {
    sku: "streak_freeze",
    title: "Заморозка стрика",
    description: "Сохранить streak на 1 день (макс. 3/мес)",
    cost: AIT_STREAK_FREEZE_COST,
    category: "utility",
    durationDays: null,
  },
  {
    sku: "extra_chat_room",
    title: "+1 группа",
    description: "Дополнительный слот для своей группы",
    cost: 600,
    category: "social",
    durationDays: null,
  },
  {
    sku: "creator_badge",
    title: "Бейдж Storyteller",
    description: "Золотая обводка аватара в ленте и чатах",
    cost: 800,
    category: "creator",
    durationDays: 90,
  },
  {
    sku: "room_spotlight_48h",
    title: "Spotlight группы",
    description: "Группа выше в каталоге 48 часов",
    cost: 300,
    category: "social",
    durationDays: 2,
  },
];

export const AIT_TIP_PRESETS = [5, 10, 25, 50, 100, 500] as const;
export const AIT_TIP_MIN = 1;
export const AIT_TIP_MAX = 500;
export const AIT_TIP_CREATOR_SHARE = 0.95;
export const AIT_TIP_BURN_RATE = AIT_BURN_RATES.tip;

export type CreatorRankId = "scout" | "guide" | "storyteller" | "ambassador" | "legend";

export const CREATOR_RANKS: {
  id: CreatorRankId;
  title: string;
  minLifetimeCreator: number;
}[] = [
  { id: "scout", title: "Scout", minLifetimeCreator: 0 },
  { id: "guide", title: "Guide", minLifetimeCreator: 500 },
  { id: "storyteller", title: "Storyteller", minLifetimeCreator: 2000 },
  { id: "ambassador", title: "Ambassador", minLifetimeCreator: 10000 },
  { id: "legend", title: "Legend", minLifetimeCreator: 50000 },
];

export function resolveCreatorRank(lifetimeCreator: number): (typeof CREATOR_RANKS)[number] {
  let rank = CREATOR_RANKS[0]!;
  for (const r of CREATOR_RANKS) {
    if (lifetimeCreator >= r.minLifetimeCreator) rank = r;
  }
  return rank;
}

export type WeeklyQuestDef = {
  id: string;
  title: string;
  description: string;
  reward: number;
  ring?: ActivityRingId;
  target: number;
};

export const WEEKLY_QUESTS: WeeklyQuestDef[] = [
  {
    id: "voice_7",
    title: "Голос недели",
    description: "7 осмысленных сообщений в группах",
    reward: 100,
    ring: "voice",
    target: 7,
  },
  {
    id: "story_2",
    title: "Две истории",
    description: "2 поста с фото или видео",
    reward: 120,
    ring: "story",
    target: 2,
  },
  {
    id: "echo_10",
    title: "Отклик",
    description: "10 лайков или комментариев другим",
    reward: 60,
    ring: "echo",
    target: 10,
  },
  {
    id: "pulse_5",
    title: "Пульс",
    description: "5 дней входа в приложение",
    reward: 80,
    ring: "pulse",
    target: 5,
  },
];

export const RING_REASON_MAP: Record<ActivityRingId, AitReasonCode[]> = {
  voice: ["chat_message", "chat_message_media", "dm_message"],
  story: ["post_text", "post_media", "post_story", "post_reel", "post_journal"],
  echo: ["comment", "follow", "like_received"],
  pulse: ["daily_login", "presence_pulse", "profile_complete", "friend_accepted"],
};

export const RING_DAILY_TARGET = 5;

/** Quality Score price multipliers for boost */
export function boostPriceMultiplier(qs: number): number {
  if (qs >= 90) return 0.5;
  if (qs >= 80) return 0.7;
  if (qs >= 70) return 0.85;
  if (qs >= 60) return 1;
  if (qs >= 50) return 1.25;
  return 2;
}

export const BOOST_QS_REJECT_THRESHOLD = 50;
export const BOOST_VERIFIED_DISCOUNT = 0.6;
export const BOOST_UNVERIFIED_MULTIPLIER = 3;
