import {
  AIT_CATALOG,
  AIT_CREATOR_REWARDS,
  AIT_DAILY_CAPS,
  AIT_REWARDS,
  AIT_TIP_CREATOR_SHARE,
  AIT_TIP_MAX,
  AIT_TIP_MIN,
  RING_REASON_MAP,
  WEEKLY_QUESTS,
  resolveCreatorRank,
  type AitReasonCode,
  type ActivityRingId,
} from "@shared/ait";
import * as store from "./store";

export type AitGrantResult = {
  granted: boolean;
  amount: number;
  wallet: "spend" | "creator";
  title: string;
  reason: AitReasonCode;
};

const REASON_TITLES: Partial<Record<AitReasonCode, string>> = {
  welcome: "Добро пожаловать",
  daily_login: "Ежедневный вход",
  presence_pulse: "В сети",
  profile_complete: "Профиль заполнен",
  post_text: "Пост в ленте",
  post_media: "Пост с медиа",
  post_story: "Story",
  post_reel: "Reel",
  post_journal: "Журнал",
  comment: "Комментарий",
  chat_message: "Сообщение в группе",
  chat_message_media: "Медиа в группе",
  dm_message: "Личное сообщение",
  review: "Отзыв",
  review_photo: "Отзыв с фото",
  friend_accepted: "Новая дружба",
  follow: "Подписка",
  event_register: "Регистрация на событие",
  music_upload: "Трек в библиотеке",
  chat_room_created: "Новая группа",
  trip_created: "Поездка создана",
  like_received: "Лайк на ваш контент",
  comment_received: "Комментарий к посту",
  chat_like_received: "Лайк в чате",
  tip_sent: "Чаевые автору",
  tip_received: "Чаевые от читателя",
  quest_weekly: "Квест недели",
  rings_weekly: "Все кольца активности",
  spend_shop: "Покупка в магазине AIT",
  trip_cinema_watch: "Trip Cinema",
  trip_checkin: "Check-in в поездке",
  referral_inviter: "Пригласил друга",
  referral_joined: "Реферальный бонус",
  creator_fund_payout: "Creator Fund",
};

function ringForReason(reason: AitReasonCode): ActivityRingId | null {
  for (const [ring, reasons] of Object.entries(RING_REASON_MAP) as [
    ActivityRingId,
    AitReasonCode[],
  ][]) {
    if (reasons.includes(reason)) return ring;
  }
  return null;
}

export async function tryGrantSpend(
  userId: string,
  reason: AitReasonCode,
  opts?: {
    entityType?: string | null;
    entityId?: string | null;
    amountOverride?: number;
    skipCap?: boolean;
  },
): Promise<AitGrantResult | null> {
  const amount = opts?.amountOverride ?? AIT_REWARDS[reason];
  if (!amount || amount <= 0) return null;

  if (!opts?.skipCap) {
    const cap = AIT_DAILY_CAPS[reason];
    if (cap != null) {
      const count = await store.getDailyCapCount(userId, reason);
      if (count >= cap) return null;
      await store.incrementDailyCap(userId, reason);
    }
  }

  const title = REASON_TITLES[reason] ?? reason;
  const result = await store.applyBalanceDelta(
    userId,
    "spend",
    amount,
    reason,
    title,
    opts?.entityType ?? null,
    opts?.entityId ?? null,
  );
  if (!result) return null;

  const ring = ringForReason(reason);
  if (ring) await store.incrementRing(userId, ring);

  const grant = { granted: true, amount, wallet: "spend" as const, title, reason };
  const { maybePushAitGrant } = await import("./push-notify");
  void maybePushAitGrant(userId, grant);
  return grant;
}

export async function tryGrantCreator(
  userId: string,
  reason: AitReasonCode,
  opts?: {
    entityType?: string | null;
    entityId?: string | null;
    amountOverride?: number;
    skipCap?: boolean;
  },
): Promise<AitGrantResult | null> {
  const amount = opts?.amountOverride ?? AIT_CREATOR_REWARDS[reason];
  if (!amount || amount <= 0) return null;

  const cap = opts?.skipCap ? undefined : AIT_DAILY_CAPS[reason];
  if (cap != null) {
    const count = await store.getDailyCapCount(userId, reason);
    if (count >= cap) return null;
    await store.incrementDailyCap(userId, reason);
  }

  const title = REASON_TITLES[reason] ?? reason;
  const result = await store.applyBalanceDelta(
    userId,
    "creator",
    amount,
    reason,
    title,
    opts?.entityType ?? null,
    opts?.entityId ?? null,
  );
  if (!result) return null;

  const grant = { granted: true, amount, wallet: "creator" as const, title, reason };
  const { maybePushAitGrant } = await import("./push-notify");
  void maybePushAitGrant(userId, grant);
  return grant;
}

export async function onDailyPulse(userId: string): Promise<AitGrantResult[]> {
  const grants: AitGrantResult[] = [];
  await store.touchStreak(userId);
  const login = await tryGrantSpend(userId, "daily_login");
  if (login) grants.push(login);
  const pulse = await tryGrantSpend(userId, "presence_pulse");
  if (pulse) grants.push(pulse);
  return grants;
}

export async function tipPost(
  fromUserId: string,
  postId: string,
  amount: number,
  authorId: string,
): Promise<{ ok: boolean; message?: string; grant?: AitGrantResult }> {
  if (fromUserId === authorId) {
    return { ok: false, message: "Нельзя отправить чаевые себе" };
  }
  const amt = Math.floor(amount);
  if (amt < AIT_TIP_MIN || amt > AIT_TIP_MAX) {
    return { ok: false, message: `Сумма от ${AIT_TIP_MIN} до ${AIT_TIP_MAX} AIT` };
  }
  const creatorShare = Math.floor(amt * AIT_TIP_CREATOR_SHARE);
  const burned = amt - creatorShare;

  const spent = await store.applyBalanceDelta(
    fromUserId,
    "spend",
    -amt,
    "tip_sent",
    "Чаевые автору",
    "post",
    postId,
  );
  if (!spent) return { ok: false, message: "Недостаточно AIT" };

  await tryGrantCreator(authorId, "tip_received", {
    amountOverride: creatorShare,
    entityType: "post",
    entityId: postId,
  });
  void burned;

  return {
    ok: true,
    grant: {
      granted: true,
      amount: -amt,
      wallet: "spend",
      title: "Чаевые отправлены",
      reason: "tip_sent",
    },
  };
}

export async function spendCatalogItem(
  userId: string,
  sku: string,
  opts?: { postId?: string },
): Promise<{ ok: boolean; message?: string }> {
  const item = AIT_CATALOG.find((i) => i.sku === sku);
  if (!item) return { ok: false, message: "Товар не найден" };

  if (sku === "boost_post_24h" && !opts?.postId) {
    return { ok: false, message: "Укажите пост для буста" };
  }

  const entitlements = await store.getEntitlements(userId);
  if (
    item.durationDays == null &&
    entitlements.some((e) => e.sku === sku) &&
    sku !== "boost_post_24h"
  ) {
    return { ok: false, message: "У вас уже есть этот предмет" };
  }

  const spent = await store.applyBalanceDelta(
    userId,
    "spend",
    -item.cost,
    "spend_shop",
    item.title,
    "sku",
    sku,
  );
  if (!spent) return { ok: false, message: "Недостаточно AIT" };

  const expiresAt =
    item.durationDays != null
      ? new Date(Date.now() + item.durationDays * 24 * 60 * 60 * 1000)
      : null;
  if (sku !== "boost_post_24h") {
    await store.addEntitlement(userId, sku, expiresAt);
  }

  if (sku === "boost_post_24h" && opts?.postId) {
    const { addPostBoost } = await import("./perks");
    await addPostBoost(opts.postId, userId, 24);
  }

  return { ok: true };
}

export async function tipUser(
  fromUserId: string,
  toUserId: string,
  amount: number,
): Promise<{ ok: boolean; message?: string; grant?: AitGrantResult }> {
  if (fromUserId === toUserId) {
    return { ok: false, message: "Нельзя отправить чаевые себе" };
  }
  const amt = Math.floor(amount);
  if (amt < AIT_TIP_MIN || amt > AIT_TIP_MAX) {
    return { ok: false, message: `Сумма от ${AIT_TIP_MIN} до ${AIT_TIP_MAX} AIT` };
  }
  const creatorShare = Math.floor(amt * AIT_TIP_CREATOR_SHARE);

  const spent = await store.applyBalanceDelta(
    fromUserId,
    "spend",
    -amt,
    "tip_sent",
    "Чаевые автору",
    "user",
    toUserId,
  );
  if (!spent) return { ok: false, message: "Недостаточно AIT" };

  await tryGrantCreator(toUserId, "tip_received", {
    amountOverride: creatorShare,
    entityType: "user",
    entityId: fromUserId,
  });

  return {
    ok: true,
    grant: {
      granted: true,
      amount: -amt,
      wallet: "spend",
      title: "Чаевые отправлены",
      reason: "tip_sent",
    },
  };
}

export async function claimWeeklyQuest(
  userId: string,
  questId: string,
): Promise<{ ok: boolean; message?: string; grant?: AitGrantResult }> {
  const quest = WEEKLY_QUESTS.find((q) => q.id === questId);
  if (!quest) return { ok: false, message: "Квест не найден" };

  const progress = await store.getQuestProgress(userId);
  const state = progress[questId];
  if (!state || state.claimed) return { ok: false, message: "Уже получено" };
  if (state.progress < quest.target) {
    return { ok: false, message: `Прогресс ${state.progress}/${quest.target}` };
  }

  const claimed = await store.claimQuest(userId, questId);
  if (!claimed) return { ok: false, message: "Уже получено" };

  const grant = await tryGrantSpend(userId, "quest_weekly", {
    amountOverride: quest.reward,
    skipCap: true,
    entityType: "quest",
    entityId: questId,
  });
  return { ok: true, grant: grant ?? undefined };
}

export async function getAitDashboard(userId: string) {
  const balance = await store.getOrCreateBalance(userId);
  const rank = resolveCreatorRank(balance.lifetimeCreatorEarned);
  const rings = await store.getRingProgress(userId);
  const quests = await store.getQuestProgress(userId);
  const entitlements = await store.getEntitlements(userId);
  const ledger = await store.getLedger(userId, 25);

  const allRingsFull = Object.values(rings).every((r) => r.percent >= 100);

  return {
    spendBalance: balance.spendBalance,
    creatorBalance: balance.creatorBalance,
    lifetimeSpendEarned: balance.lifetimeSpendEarned,
    lifetimeCreatorEarned: balance.lifetimeCreatorEarned,
    streakDays: balance.streakDays,
    creatorRank: rank,
    rings,
    allRingsFull,
    quests: WEEKLY_QUESTS.map((q) => ({
      ...q,
      progress: quests[q.id]?.progress ?? 0,
      claimed: quests[q.id]?.claimed ?? false,
    })),
    catalog: AIT_CATALOG,
    entitlements: entitlements.map((e) => ({
      sku: e.sku,
      expiresAt: e.expiresAt?.toISOString() ?? null,
    })),
    ledger: ledger.map((t) => ({
      id: t.id,
      wallet: t.wallet,
      delta: t.delta,
      reason: t.reasonCode,
      title: t.title,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

export async function ensureAitReady(): Promise<void> {
  await store.ensureAitSchema();
  const { ensureCreatorFundSchema } = await import("./creator-fund");
  await ensureCreatorFundSchema();
  const { ensureReferralSchema } = await import("./referral");
  await ensureReferralSchema();
}
