import type { StoryStripItem } from "@/components/feed/StoriesStrip";
import type {
  FeaturedGuideWidgetData,
  TrendingWidgetItem,
} from "@/components/community/RightPanelWidgets";
import {
  DEST_BALI_SRC,
  DEST_ICELAND_SRC,
  DEST_ITALY_SRC,
  DEST_JAPAN_SRC,
  DEST_NORWAY_SRC,
  DEST_PERU_SRC,
} from "@/lib/marketing-images";
import type { TravelPostWithAuthor } from "@shared/schema";
import i18n from "@/i18n";

function isDemoEnglish(): boolean {
  return i18n.language?.startsWith("en") ?? false;
}

function pickLocalized<T>(ru: T, en: T): T {
  return isDemoEnglish() ? en : ru;
}

export const DEMO_STATS = {
  countries: "196",
  places: "42K",
  travelers: "1.2M",
  reels: "89K",
  rating: "4.9",
} as const;

export function isSocialFeedDemoMode(): boolean {
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

export function isDemoPostId(id: string): boolean {
  return id.startsWith("demo-");
}

export function formatTrendCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(count);
}

const DEMO_TRENDS_RU: TrendingWidgetItem[] = [
  { id: "japan", name: "Япония", count: 12500, flagEmoji: "🇯🇵" },
  { id: "iceland", name: "Исландия", count: 9800, flagEmoji: "🇮🇸" },
  { id: "portugal", name: "Португалия", count: 8100, flagEmoji: "🇵🇹" },
  { id: "thailand", name: "Таиланд", count: 7300, flagEmoji: "🇹🇭" },
  { id: "italy", name: "Италия", count: 6900, flagEmoji: "🇮🇹" },
];

const DEMO_TRENDS_EN: TrendingWidgetItem[] = [
  { id: "japan", name: "Japan", count: 12500, flagEmoji: "🇯🇵" },
  { id: "iceland", name: "Iceland", count: 9800, flagEmoji: "🇮🇸" },
  { id: "portugal", name: "Portugal", count: 8100, flagEmoji: "🇵🇹" },
  { id: "thailand", name: "Thailand", count: 7300, flagEmoji: "🇹🇭" },
  { id: "italy", name: "Italy", count: 6900, flagEmoji: "🇮🇹" },
];

/** @deprecated Use getDemoTrends() for locale-aware demo trends. */
export const DEMO_TRENDS = DEMO_TRENDS_RU;

export function getDemoTrends(): TrendingWidgetItem[] {
  return pickLocalized(DEMO_TRENDS_RU, DEMO_TRENDS_EN);
}

const DEMO_FEATURED_GUIDE_RU: FeaturedGuideWidgetData = {
  title: "Путеводитель по Амальфи",
  meta: "12 мест • 5 дней маршрута",
  imageSrc: DEST_ITALY_SRC,
  href: "/social-feed?format=public",
  badgeLabel: "Featured Guide",
};

const DEMO_FEATURED_GUIDE_EN: FeaturedGuideWidgetData = {
  title: "Amalfi Coast guide",
  meta: "12 places • 5-day route",
  imageSrc: DEST_ITALY_SRC,
  href: "/social-feed?format=public",
  badgeLabel: "Featured Guide",
};

/** @deprecated Use getDemoFeaturedGuide() for locale-aware demo featured guide. */
export const DEMO_FEATURED_GUIDE = DEMO_FEATURED_GUIDE_RU;

export function getDemoFeaturedGuide(): FeaturedGuideWidgetData {
  return pickLocalized(DEMO_FEATURED_GUIDE_RU, DEMO_FEATURED_GUIDE_EN);
}

const DEMO_VIDEO_SAMPLES = [
  "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beach-with-palms-1564-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-aerial-panorama-of-a-landscape-with-mountains-4249-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-1165-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-people-walking-on-the-street-4374-large.mp4",
] as const;

type DemoAuthor = {
  id: string;
  handle: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isPro?: boolean;
};

const DEMO_AUTHORS: DemoAuthor[] = [
  {
    id: "demo-anna",
    handle: "@anna.travel",
    firstName: "Anna",
    lastName: "Travel",
    avatar: "https://i.pravatar.cc/150?img=5",
    isPro: true,
  },
  {
    id: "demo-alex",
    handle: "@world.by.alex",
    firstName: "Alex",
    lastName: "Kim",
    avatar: "https://i.pravatar.cc/150?img=12",
    isPro: true,
  },
  {
    id: "demo-ivan",
    handle: "@ivan.adventures",
    firstName: "Ivan",
    lastName: "Petrov",
    avatar: "https://i.pravatar.cc/150?img=8",
  },
  {
    id: "demo-maria",
    handle: "@maria.wanders",
    firstName: "Maria",
    lastName: "Santos",
    avatar: "https://i.pravatar.cc/150?img=9",
    isPro: true,
  },
  {
    id: "demo-leo",
    handle: "@leo.explores",
    firstName: "Leo",
    lastName: "Chen",
    avatar: "https://i.pravatar.cc/150?img=15",
  },
];

function authorAt(index: number): DemoAuthor {
  return DEMO_AUTHORS[index % DEMO_AUTHORS.length]!;
}

function basePost(
  partial: Partial<TravelPostWithAuthor> & Pick<TravelPostWithAuthor, "id" | "format" | "userId">,
): TravelPostWithAuthor {
  const now = new Date();
  return {
    title: "",
    content: " ",
    images: [],
    location: null,
    latitude: null,
    longitude: null,
    tags: [],
    isPublic: true,
    tripId: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
    author: null,
    likesCount: 0,
    commentsCount: 0,
    isLiked: false,
    ...partial,
  } as TravelPostWithAuthor;
}

function withAuthor(post: TravelPostWithAuthor, author: DemoAuthor): TravelPostWithAuthor {
  const result: TravelPostWithAuthor & { creatorBadge?: boolean } = {
    ...post,
    author: {
      id: author.id,
      firstName: author.firstName,
      lastName: author.lastName,
      profileImageUrl: author.avatar,
    },
  };
  if (author.isPro) result.creatorBadge = true;
  return result;
}

export function getDemoReelPosts(): TravelPostWithAuthor[] {
  type ReelSpec = {
    id: string;
    authorIdx: number;
    location: string;
    title: string;
    content: string;
    video: string;
    likes: number;
    comments: number;
    isLiked?: boolean;
  };

  const reelsRu: ReelSpec[] = [
    {
      id: "demo-reel-1",
      authorIdx: 0,
      location: "Исландия",
      title: "Северное сияние над водопадом",
      content: "Три дня охоты за aurora — и вот этот кадр в 2 ночи 🌌",
      video: DEMO_VIDEO_SAMPLES[2],
      likes: 12400,
      comments: 342,
      isLiked: true,
    },
    {
      id: "demo-reel-2",
      authorIdx: 1,
      location: "Япония, Киото",
      title: "Утро в бамбуковой роще",
      content: "Приходите до 7:00 — иначе толпы не избежать",
      video: DEMO_VIDEO_SAMPLES[6],
      likes: 8900,
      comments: 218,
    },
    {
      id: "demo-reel-3",
      authorIdx: 2,
      location: "Португалия, Эрисейра",
      title: "Закат с серф-досок",
      content: "Идеальное место для первого урока серфинга",
      video: DEMO_VIDEO_SAMPLES[0],
      likes: 5600,
      comments: 97,
    },
    {
      id: "demo-reel-4",
      authorIdx: 3,
      location: "Бали, Убуд",
      title: "Рисовые террасы на рассвете",
      content: "Туман рассеивается к 6:30 — успевайте!",
      video: DEMO_VIDEO_SAMPLES[1],
      likes: 15200,
      comments: 401,
      isLiked: true,
    },
    {
      id: "demo-reel-5",
      authorIdx: 4,
      location: "Норвегия, Лофотены",
      title: "Дорога между фьордами",
      content: "Аренда авто — must have для этого маршрута",
      video: DEMO_VIDEO_SAMPLES[3],
      likes: 7200,
      comments: 156,
    },
    {
      id: "demo-reel-6",
      authorIdx: 0,
      location: "Перу, Мачу-Пикчу",
      title: "Первый взгляд на руины",
      content: "Стоило вставать в 4 утра ради этого кадра",
      video: DEMO_VIDEO_SAMPLES[4],
      likes: 19800,
      comments: 512,
    },
    {
      id: "demo-reel-7",
      authorIdx: 1,
      location: "Италия, Амальфи",
      title: "Лодки в Марине",
      content: "Лучший лимончелло — на маленькой площади у порта",
      video: DEMO_VIDEO_SAMPLES[5],
      likes: 11300,
      comments: 287,
    },
  ];

  const reelsEn: ReelSpec[] = [
    {
      id: "demo-reel-1",
      authorIdx: 0,
      location: "Iceland",
      title: "Northern lights over the waterfall",
      content: "Three nights hunting aurora — and this shot at 2 AM 🌌",
      video: DEMO_VIDEO_SAMPLES[2],
      likes: 12400,
      comments: 342,
      isLiked: true,
    },
    {
      id: "demo-reel-2",
      authorIdx: 1,
      location: "Kyoto, Japan",
      title: "Morning in the bamboo grove",
      content: "Arrive before 7 AM — otherwise you won't avoid the crowds",
      video: DEMO_VIDEO_SAMPLES[6],
      likes: 8900,
      comments: 218,
    },
    {
      id: "demo-reel-3",
      authorIdx: 2,
      location: "Ericeira, Portugal",
      title: "Sunset with surfboards",
      content: "Perfect spot for your first surf lesson",
      video: DEMO_VIDEO_SAMPLES[0],
      likes: 5600,
      comments: 97,
    },
    {
      id: "demo-reel-4",
      authorIdx: 3,
      location: "Ubud, Bali",
      title: "Rice terraces at sunrise",
      content: "Fog clears by 6:30 AM — don't miss it!",
      video: DEMO_VIDEO_SAMPLES[1],
      likes: 15200,
      comments: 401,
      isLiked: true,
    },
    {
      id: "demo-reel-5",
      authorIdx: 4,
      location: "Lofoten, Norway",
      title: "Road between the fjords",
      content: "Renting a car is a must for this route",
      video: DEMO_VIDEO_SAMPLES[3],
      likes: 7200,
      comments: 156,
    },
    {
      id: "demo-reel-6",
      authorIdx: 0,
      location: "Machu Picchu, Peru",
      title: "First look at the ruins",
      content: "Worth waking up at 4 AM for this shot",
      video: DEMO_VIDEO_SAMPLES[4],
      likes: 19800,
      comments: 512,
    },
    {
      id: "demo-reel-7",
      authorIdx: 1,
      location: "Amalfi, Italy",
      title: "Boats in the marina",
      content: "Best limoncello — on the small square by the port",
      video: DEMO_VIDEO_SAMPLES[5],
      likes: 11300,
      comments: 287,
    },
  ];

  const reels = pickLocalized(reelsRu, reelsEn);

  return reels.map((r) => {
    const author = authorAt(r.authorIdx);
    return withAuthor(
      basePost({
        id: r.id,
        format: "reel",
        userId: author.id,
        title: r.title,
        content: r.content,
        location: r.location,
        images: [r.video],
        likesCount: r.likes,
        commentsCount: r.comments,
        isLiked: r.isLiked ?? false,
      }),
      author,
    );
  });
}

export function getDemoStoryPosts(): TravelPostWithAuthor[] {
  type StorySpec = {
    id: string;
    authorIdx: number;
    image: string;
    location: string;
    unviewedGroup: boolean;
  };

  const storiesRu: StorySpec[] = [
    {
      id: "demo-story-1",
      authorIdx: 0,
      image: DEST_JAPAN_SRC,
      location: "Токио",
      unviewedGroup: true,
    },
    {
      id: "demo-story-2",
      authorIdx: 1,
      image: DEST_ICELAND_SRC,
      location: "Рейкьявик",
      unviewedGroup: true,
    },
    {
      id: "demo-story-3",
      authorIdx: 2,
      image: DEST_PERU_SRC,
      location: "Куско",
      unviewedGroup: true,
    },
    {
      id: "demo-story-4",
      authorIdx: 3,
      image: DEST_BALI_SRC,
      location: "Бали",
      unviewedGroup: false,
    },
    {
      id: "demo-story-5",
      authorIdx: 4,
      image: DEST_NORWAY_SRC,
      location: "Берген",
      unviewedGroup: true,
    },
    {
      id: "demo-story-6",
      authorIdx: 0,
      image: DEST_ITALY_SRC,
      location: "Рим",
      unviewedGroup: true,
    },
    {
      id: "demo-story-7",
      authorIdx: 1,
      image: DEST_JAPAN_SRC,
      location: "Осака",
      unviewedGroup: false,
    },
    {
      id: "demo-story-8",
      authorIdx: 2,
      image: DEST_ICELAND_SRC,
      location: "Вик",
      unviewedGroup: true,
    },
    {
      id: "demo-story-9",
      authorIdx: 3,
      image: DEST_BALI_SRC,
      location: "Убуд",
      unviewedGroup: false,
    },
    {
      id: "demo-story-10",
      authorIdx: 4,
      image: DEST_PERU_SRC,
      location: "Лима",
      unviewedGroup: true,
    },
  ];

  const storiesEn: StorySpec[] = [
    { id: "demo-story-1", authorIdx: 0, image: DEST_JAPAN_SRC, location: "Tokyo", unviewedGroup: true },
    { id: "demo-story-2", authorIdx: 1, image: DEST_ICELAND_SRC, location: "Reykjavik", unviewedGroup: true },
    { id: "demo-story-3", authorIdx: 2, image: DEST_PERU_SRC, location: "Cusco", unviewedGroup: true },
    { id: "demo-story-4", authorIdx: 3, image: DEST_BALI_SRC, location: "Bali", unviewedGroup: false },
    { id: "demo-story-5", authorIdx: 4, image: DEST_NORWAY_SRC, location: "Bergen", unviewedGroup: true },
    { id: "demo-story-6", authorIdx: 0, image: DEST_ITALY_SRC, location: "Rome", unviewedGroup: true },
    { id: "demo-story-7", authorIdx: 1, image: DEST_JAPAN_SRC, location: "Osaka", unviewedGroup: false },
    { id: "demo-story-8", authorIdx: 2, image: DEST_ICELAND_SRC, location: "Vik", unviewedGroup: true },
    { id: "demo-story-9", authorIdx: 3, image: DEST_BALI_SRC, location: "Ubud", unviewedGroup: false },
    { id: "demo-story-10", authorIdx: 4, image: DEST_PERU_SRC, location: "Lima", unviewedGroup: true },
  ];

  const stories = pickLocalized(storiesRu, storiesEn);

  return stories.map((s) => {
    const author = authorAt(s.authorIdx);
    const expires = new Date(Date.now() + 20 * 60 * 60 * 1000);
    return withAuthor(
      basePost({
        id: s.id,
        format: "story",
        userId: author.id,
        title: "",
        content: s.location,
        location: s.location,
        images: [s.image],
        expiresAt: expires,
      }),
      author,
    );
  });
}

/** Pre-mapped strip items with handle labels for demo mode. */
export function getDemoStoryStripItems(): StoryStripItem[] {
  const seenAuthors = new Set<string>();
  const unviewedAuthors = new Set(
    getDemoStoryPosts()
      .filter((_, i) => [0, 1, 2, 4, 5, 7, 9].includes(i))
      .map((p) => p.userId),
  );

  return DEMO_AUTHORS.slice(0, 8).map((author) => {
    const story = getDemoStoryPosts().find((p) => p.userId === author.id);
    const image = story?.images?.[0];
    const unviewed = unviewedAuthors.has(author.id) && !seenAuthors.has(author.id);
    seenAuthors.add(author.id);
    return {
      id: author.id,
      label: author.handle,
      avatarSrc: author.avatar,
      previewSrc: image ?? author.avatar,
      fallback: author.firstName[0] ?? "?",
      unviewed,
    };
  });
}

const DEMO_ALEXEI_RU: DemoAuthor = {
  id: "demo-alexei",
  handle: "@alexei.north",
  firstName: "Алексей",
  lastName: "К.",
  avatar: "https://i.pravatar.cc/150?img=11",
  isPro: true,
};

const DEMO_ALEXEI_EN: DemoAuthor = {
  id: "demo-alexei",
  handle: "@alexei.north",
  firstName: "Alexey",
  lastName: "K.",
  avatar: "https://i.pravatar.cc/150?img=11",
  isPro: true,
};

function demoAlexei(): DemoAuthor {
  return pickLocalized(DEMO_ALEXEI_RU, DEMO_ALEXEI_EN);
}

export function getDemoFeedPosts(): TravelPostWithAuthor[] {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const alexei = demoAlexei();

  const feedRu = [
    withAuthor(
      basePost({
        id: "demo-feed-1",
        format: "post",
        userId: alexei.id,
        title: "Северное сияние в Исландии — это магия!",
        content:
          "Три ночи охоты за aurora окупились этим кадром. Делюсь маршрутом и лучшими точками вокруг Рейкьявика — сохраняйте в закладки!",
        location: "Исландия",
        images: [DEST_ICELAND_SRC, DEST_NORWAY_SRC, DEST_ICELAND_SRC, DEST_NORWAY_SRC],
        likesCount: 4820,
        commentsCount: 312,
        tags: ["исландия", "aurora", "природа"],
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      }),
      alexei,
    ),
    withAuthor(
      basePost({
        id: "demo-feed-2",
        format: "post",
        userId: DEMO_AUTHORS[0]!.id,
        title: "Уличная еда в Осаке",
        content:
          "Dotonbori вечером — лучший гастротур за один вечер. Топ-5 ларьков оставлю в комментариях.",
        location: "Япония",
        images: [DEST_JAPAN_SRC, DEST_JAPAN_SRC],
        likesCount: 2190,
        commentsCount: 94,
        tags: ["япония", "еда"],
        createdAt: weekAgo,
        updatedAt: weekAgo,
      }),
      DEMO_AUTHORS[0]!,
    ),
  ];

  const feedEn = [
    withAuthor(
      basePost({
        id: "demo-feed-1",
        format: "post",
        userId: alexei.id,
        title: "Northern lights in Iceland — pure magic!",
        content:
          "Three nights hunting aurora paid off with this shot. Sharing my route and best spots around Reykjavik — save for later!",
        location: "Iceland",
        images: [DEST_ICELAND_SRC, DEST_NORWAY_SRC, DEST_ICELAND_SRC, DEST_NORWAY_SRC],
        likesCount: 4820,
        commentsCount: 312,
        tags: ["iceland", "aurora", "nature"],
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      }),
      alexei,
    ),
    withAuthor(
      basePost({
        id: "demo-feed-2",
        format: "post",
        userId: DEMO_AUTHORS[0]!.id,
        title: "Street food in Osaka",
        content:
          "Dotonbori at night — the best food tour in one evening. Top 5 stalls in the comments.",
        location: "Japan",
        images: [DEST_JAPAN_SRC, DEST_JAPAN_SRC],
        likesCount: 2190,
        commentsCount: 94,
        tags: ["japan", "food"],
        createdAt: weekAgo,
        updatedAt: weekAgo,
      }),
      DEMO_AUTHORS[0]!,
    ),
  ];

  return pickLocalized(feedRu, feedEn);
}

export function getDemoJournalPosts(): TravelPostWithAuthor[] {
  const monthAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const journalRu = [
    withAuthor(
      basePost({
        id: "demo-journal-1",
        format: "journal",
        userId: DEMO_AUTHORS[3]!.id,
        title: "Две недели по Амальфитанскому побережью",
        content:
          "Путешествие началось в Сорренто — идеальная база для поездок по побережью. " +
          "Первые три дня мы исследовали Позитано и Равелло, наслаждаясь видами с террас. " +
          "День четвёртый посвятили катеру до Капри: Голубой грот оказался главным открытием. " +
          "В Амальфи обязательно зайдите в Duomo и попробуйте лимончелло у порта. " +
          "Совет: бронируйте парковки заранее, узкие дороги не прощают опозданий.",
        location: "Италия, Амальфи",
        images: [DEST_ITALY_SRC, DEST_ITALY_SRC],
        likesCount: 890,
        commentsCount: 64,
        tags: ["италия", "амальфи", "журнал"],
        isPublic: true,
        createdAt: monthAgo,
        updatedAt: monthAgo,
      }),
      DEMO_AUTHORS[3]!,
    ),
  ];

  const journalEn = [
    withAuthor(
      basePost({
        id: "demo-journal-1",
        format: "journal",
        userId: DEMO_AUTHORS[3]!.id,
        title: "Two weeks on the Amalfi Coast",
        content:
          "The trip started in Sorrento — a perfect base for exploring the coast. " +
          "The first three days we explored Positano and Ravello, enjoying terrace views. " +
          "Day four was a boat to Capri: the Blue Grotto was the highlight. " +
          "In Amalfi, visit the Duomo and try limoncello by the port. " +
          "Tip: book parking in advance — narrow roads don't forgive delays.",
        location: "Amalfi, Italy",
        images: [DEST_ITALY_SRC, DEST_ITALY_SRC],
        likesCount: 890,
        commentsCount: 64,
        tags: ["italy", "amalfi", "journal"],
        isPublic: true,
        createdAt: monthAgo,
        updatedAt: monthAgo,
      }),
      DEMO_AUTHORS[3]!,
    ),
  ];

  return pickLocalized(journalRu, journalEn);
}

export function shouldUseDemoFeed(
  apiPosts: TravelPostWithAuthor[],
  contentFormat: "feed" | "stories" | "reels" | "journals" | "public",
): boolean {
  if (!isSocialFeedDemoMode()) return false;
  return contentFormat !== "public";
}

export function resolveDemoPosts(
  apiPosts: TravelPostWithAuthor[],
  contentFormat: "feed" | "stories" | "reels" | "journals" | "public",
): TravelPostWithAuthor[] {
  if (!shouldUseDemoFeed(apiPosts, contentFormat)) return apiPosts;
  if (contentFormat === "reels") return getDemoReelPosts();
  if (contentFormat === "stories") return getDemoStoryPosts();
  if (contentFormat === "feed") return getDemoFeedPosts();
  if (contentFormat === "journals") return getDemoJournalPosts();
  return apiPosts;
}
