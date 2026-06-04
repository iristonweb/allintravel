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
  | "creator_fund_payout"
  | "admin_adjust";

export const AIT_REFERRAL_REWARD = 50;

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

/** Spend-wallet rewards */
export const AIT_REWARDS: Partial<Record<AitReasonCode, number>> = {
  welcome: 100,
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
  trip_created: 10,
  trip_cinema_watch: 20,
  trip_checkin: 12,
  referral_inviter: AIT_REFERRAL_REWARD,
  referral_joined: AIT_REFERRAL_REWARD,
  quest_weekly: 100,
  rings_weekly: 120,
};

/** Creator-wallet rewards (audience → author) */
export const AIT_CREATOR_REWARDS: Partial<Record<AitReasonCode, number>> = {
  like_received: 3,
  comment_received: 5,
  chat_like_received: 4,
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
  comment: 20,
  chat_message: 25,
  chat_message_media: 10,
  dm_message: 30,
  follow: 15,
  like_received: 60,
  comment_received: 40,
  chat_like_received: 50,
  tip_received: 500,
  trip_cinema_watch: 3,
  trip_checkin: 1,
  referral_inviter: 10,
  referral_joined: 1,
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
    description: "Пост выше в общей ленте на сутки",
    cost: 200,
    category: "social",
    durationDays: 1,
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

export const AIT_TIP_PRESETS = [10, 50, 100] as const;
export const AIT_TIP_MIN = 5;
export const AIT_TIP_MAX = 500;
export const AIT_TIP_CREATOR_SHARE = 0.9;

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
