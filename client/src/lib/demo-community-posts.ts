import type { FeedMode } from "@/lib/feed-utils";
import {
  COMMUNITY_TRAVEL_SRC,
  DEST_BALI_SRC,
  DEST_ICELAND_SRC,
  DEST_ITALY_SRC,
  DEST_JAPAN_SRC,
} from "@/lib/marketing-images";

export type DemoCommunityPost = {
  id: string;
  authorName: string;
  authorAvatar: string;
  location: string;
  imageUrl: string;
  excerpt: string;
  likesCount: number;
  commentsCount: number;
};

const allPosts: DemoCommunityPost[] = [
  {
    id: "demo-1",
    authorName: "Мария Петрова",
    authorAvatar: "https://i.pravatar.cc/120?img=5",
    location: "Бали, Индонезия",
    imageUrl: DEST_BALI_SRC,
    excerpt:
      "Рассвет у вулкана Батур — одно из самых сильных впечатлений в жизни. Кто был на Бали — поймёт 🌋",
    likesCount: 2400,
    commentsCount: 186,
  },
  {
    id: "demo-2",
    authorName: "Алексей Ким",
    authorAvatar: "https://i.pravatar.cc/120?img=12",
    location: "Токио, Япония",
    imageUrl: DEST_JAPAN_SRC,
    excerpt: "Синдзюку ночью — это отдельная вселенная. Лучший стрит-фуд за углом от отеля.",
    likesCount: 890,
    commentsCount: 64,
  },
  {
    id: "demo-3",
    authorName: "София Ларссон",
    authorAvatar: "https://i.pravatar.cc/120?img=32",
    location: "Рейкьявик, Исландия",
    imageUrl: DEST_ICELAND_SRC,
    excerpt: "Северное сияние в первый же вечер — повезло с погодой. Берите термобель!",
    likesCount: 3100,
    commentsCount: 241,
  },
];

const followingPosts: DemoCommunityPost[] = [
  {
    id: "demo-f1",
    authorName: "Иван Орлов",
    authorAvatar: "https://i.pravatar.cc/120?img=8",
    location: "Лиссабон, Португалия",
    imageUrl: DEST_ITALY_SRC,
    excerpt: "Трамвай 28 в 7 утра — без очередей и с идеальным светом для фото.",
    likesCount: 412,
    commentsCount: 28,
  },
  {
    id: "demo-f2",
    authorName: "Елена Вольф",
    authorAvatar: "https://i.pravatar.cc/120?img=25",
    location: "Каппадокия, Турция",
    imageUrl: COMMUNITY_TRAVEL_SRC,
    excerpt: "Полёт на рассвете забронировала через приложение — всё срослось идеально.",
    likesCount: 1205,
    commentsCount: 97,
  },
];

const popularPosts: DemoCommunityPost[] = [...allPosts, ...followingPosts].sort(
  (a, b) => b.likesCount - a.likesCount,
);

export function getDemoPostsForMode(mode: FeedMode): DemoCommunityPost[] {
  switch (mode) {
    case "following":
      return followingPosts;
    case "popular":
      return popularPosts;
    default:
      return allPosts;
  }
}
