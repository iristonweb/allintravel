# All In Travel — Социальная платформа для путешественников

## Overview

Полнофункциональное travel-приложение "All In Travel" — социальная платформа для поиска попутчиков, обмена впечатлениями от путешествий, планирования поездок и общения в чате.

## User Preferences

Preferred communication style: Simple, everyday language (Russian).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 + TypeScript
- **Routing**: Wouter (client-side)
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: TanStack Query v5 for server state
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js + Express.js
- **Language**: TypeScript
- **Session**: express-session (in-memory for dev)
- **Real-time**: WebSocket server (`/ws`) for group chat
- **Auth**: Replit OAuth (OIDC) via `replitAuth.ts`

### Data Storage
- **Storage**: MemStorage (in-memory) — data resets on server restart
- **ORM**: Drizzle ORM (schema defined, used for types)
- **Validation**: Zod + drizzle-zod

## Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/` | Home | Главная — места, поездки, события, лента |
| `/trips` | Trips | Поездки — список, создание, поиск, join |
| `/events` | Events | События — предстоящие и прошедшие |
| `/social-feed` | SocialFeed | Лента постов с лайками и комментариями |
| `/chat` | Chat | Групповой чат по комнатам (WebSocket) |
| `/friends` | Friends | Друзья — поиск, запросы, управление |
| `/messages` | Messages | Личные сообщения (диалоги) |
| `/profile` | Profile | Профиль — посты, поездки, отзывы, избранное |
| `/place/:id` | PlaceDetails | Детали места с отзывами |

## API Endpoints (Key)

### Posts
- `GET /api/posts` — посты, обогащённые автором + likesCount + commentsCount + isLiked
- `POST /api/posts` — создать пост
- `POST /api/posts/:id/like` / `DELETE /api/posts/:id/like` — лайк/анлайк
- `POST /api/posts/:id/comments` — добавить комментарий

### Friends
- `GET /api/friends` — список друзей (с данными User)
- `GET /api/friends/requests/sent` — исходящие запросы (с User)
- `GET /api/friends/requests/received` — входящие запросы (с User)
- `POST /api/friends/request/:userId` — отправить запрос
- `PUT /api/friends/respond/:id` — принять/отклонить

### Favorites
- `GET /api/favorites` — избранное, обогащённое Place
- `POST /api/favorites/:placeId` / `DELETE /api/favorites/:placeId`

### Reviews
- `GET /api/reviews/user` — отзывы текущего пользователя с Place

### Trips
- `GET /api/trips?userId=...` — поддерживает фильтр по userId

### Search
- `GET /api/search/users?q=...` — поиск пользователей

### Chat
- `GET /api/chat/:room` — история сообщений
- `WS /ws` — WebSocket для realtime сообщений

## Key Implementation Details

### queryClient URL generation
- `["/api/endpoint", { key: value }]` → GET `/api/endpoint?key=value`
- `["/api/endpoint/segment"]` → GET `/api/endpoint/segment`

### Enriched response types (shared/schema.ts)
- `TravelPostWithAuthor` — пост + author + likesCount + commentsCount + isLiked
- `FriendshipWithUser` — дружба + User (другая сторона)
- `UserFavoriteWithPlace` — избранное + Place
- `ReviewWithPlace` — отзыв + Place

### Seed data (MemStorage)
- 6 мест (places): Santorini, Kyoto, Machu Picchu, Amalfi, Iceland, Louvre
- 3 события (events): Tokyo festival, Santorini workshop, Bali yoga
- 2+ поездки (trips)
- 3 тревел-поста

## Design Conventions
- Primary color: `bg-primary hover:bg-primary/90` (не coral/teal классы)
- API calls: `apiRequest("POST", "/api/endpoint", data)`
- Toast notifications: `useToast()` из `@/hooks/use-toast`
- All components have both named AND default exports
