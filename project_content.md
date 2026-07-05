allintravel — полное описание проекта
1. Идея и позиционирование
allintravel — это не туристический агрегатор и не сайт бронирования. Это платформа-экосистема для глобальной жизни в движении: путешествия, удалённая работа, сообщество, карта мира и AI-помощник в одном продукте.

Слоган: Explore · Plan · Share

Целевое позиционирование (после стратегической трансформации):

The operating system for global life — карта мира для путешествий, удалённой работы, сообщества и AI-открытий.

Ключевой дифференциатор: не каталог отелей, а social + map + planner + messenger + reputation — слой поверх мира, где люди планируют маршруты, общаются, делятся опытом и накапливают «путешественную идентичность».

Домен: allintravel.online
Репозиторий: github.com/iristonweb/allintravel

2. Продуктовая модель: что есть сейчас
Ядро (реализовано и работает)
Направление	Что делает пользователь
Карта
Ищет места, POI, маршруты; публичный доступ без логина
Поездки
Создаёт маршруты с остановками, днями, бюджетом; копирует чужие; шарит публично
Соцсеть
Лента, stories, reels, journals; лайки, комментарии, закладки
Мессенджер
Групповые чаты + личные DM; голосовые, файлы, GIF, стикеры, реакции
Друзья / подписки
Friend requests, follow, публичные профили @username
Места и события
Каталог POI, отзывы, избранное; события с регистрацией
AIT Economy
Внутренняя валюта: квесты, стрики, tips, boost постов, creator fund
AI Trip Copilot
Подбор остановок по текстовому запросу (OpenAI или эвристика)
Музыка
Личная библиотека треков, шаринг в чат, глобальный плеер
Уведомления
In-app + Web Push (VAPID)
Telegram
Mini App entry point
Новые модули (добавлены в последнем релизе)
Модуль	Статус
Travel Passport
Штампы стран/городов из поездок, achievements, share card
Trust / Reputation
Trust score, vouches, verified badge
Route Marketplace
Fork маршрута, продажа, покупка; Stripe Connect (mock без ключа)
AI Agent v2
Multi-turn copilot chat + подбор попутчиков среди друзей
GTM-страницы
Nomad hubs, Creators program, Product Hunt launch waitlist
i18n
EN/RU, переключатель языка, динамические SEO meta
Nearby feed
Лента постов рядом с пользователем (геолокация)
Видение, которое ещё впереди
Work & Travel, реальный fintech-кошелёк, 360° туры, полноценный marketplace гидов, native apps, PostGIS, B2B API — заложены в стратегии, но не полностью реализованы.

3. Архитектура (высокий уровень)
Клиент
Vercel Production
Local Dev
Данные
Внешние API
React SPA PWA
Telegram Mini App
Static dist/public
Serverless api/index.js
Express :5000
Vite HMR
WebSocket /ws
PostgreSQL Neon
Vercel Blob
MemStorage fallback
Yandex Maps/Geo
Nominatim/Photon
OpenAI Copilot
Stripe Connect
Web Push VAPID
Тип репозитория: монолитный full-stack TypeScript (один package.json, не workspaces).

Структура папок:

client/ — React SPA (Vite)
server/ — Express API + бизнес-логика
shared/ — Drizzle-схема, Zod, общие типы
migrations/ — SQL-миграции Drizzle
api/ — собранный serverless bundle для Vercel
e2e/ — Playwright-тесты
4. Frontend — как устроен
Стек
Технология	Назначение
React 18
UI
Vite 5
Сборка, HMR
Wouter
Клиентский роутинг
TanStack Query
Кэш API, polling, mutations
Tailwind + shadcn/Radix
UI-компоненты (~47 primitives)
Framer Motion
Анимации переходов
i18next
Локализация EN/RU
Leaflet / Mapbox / Yandex
Карты (приоритет: Yandex → Mapbox → Leaflet)
Роутинг (client/src/App.tsx)
Публично (без логина): /map, /places, /blog, /destinations, /trips/:id/public, /nomad-hubs, /creators, /launch

Только авторизованным: /, /trips, /social-feed, /chat, /friends, /passport, /wallet, /profile, /admin

Гостям: / → Landing, остальное → RequireLogin

UI-паттерны
AppShell — top nav + icon sidebar (desktop) + bottom nav (mobile)
GlassCard / AmbientBackground — тёмный travel-tech дизайн (purple/orange/cyan)
Feature folders: components/chat/, components/maps/, components/ait/, components/passport/, components/trust/
i18n
Локали: client/src/locales/en.ts, ru.ts
Переключатель: LanguageSwitcher в шапке
SEO: PageMeta обновляет title, description, Open Graph по языку
Fallback: English
5. Backend — как устроен
Стек
Технология	Назначение
Express 4
HTTP API
Passport.js
Local email/password + Google OAuth
express-session
Cookie-сессии (PostgreSQL store)
Drizzle ORM
Схема БД + типы
Zod + drizzle-zod
Валидация
ws
WebSocket (только локально)
Helmet + rate-limit
Безопасность
Точки входа
Dev: npm run dev → server/index.ts → Express + Vite middleware на :5000
Prod Node: npm run start → dist/server/index.js
Prod Vercel: api/index.ts → esbuild bundle из server/vercel/handler.ts
API-структура
Основной монолит: server/routes.ts (~3500 строк) — auth, users, trips, places, events, posts, chat, friends, notifications, admin и т.д.

Модульные расширения (server/modules/register.ts):

geo/ — autocomplete, поиск направлений
passport/ — Travel Passport API
trust/ — reputation, vouches
marketplace/ — fork/sell/buy маршрутов, Stripe Connect
ai/ — copilot chat, companion matching
gtm/ — nomad hubs, creator applications, launch waitlist
AIT-экономика: server/ait/ — балансы, транзакции, квесты, referrals, creator fund, leaderboard

Realtime:

Локально: WebSocket /ws + realtime-hub.ts (in-memory Map userId → sockets)
Vercel: HTTP polling чата каждые ~4 с + Web Push
Опционально: Redis pub/sub (UPSTASH_*) + отдельный worker npm run ws:dev
Auth-модель
Cookie-based session (HttpOnly, Secure в prod, SameSite=lax)
Регистрации нет отдельной страницы: первый вход по email+пароль создаёт аккаунт
Admin: флаг isAdmin + allowlist email в ADMIN_EMAILS
Privacy layer: кто видит профиль, DM, online status
6. База данных
PostgreSQL на Neon (serverless pooler, SSL).

ORM: Drizzle, схема в shared/schema.ts (~50+ таблиц).

Основные сущности
Geo: countries, cities (GeoNames import)
Users: users, user_profiles, user_privacy_settings, user_presence
Social: travel_posts, post_likes, post_comments, friendships, user_follows
Trips: trips, trip_waypoints, trip_participants, trip_invites
Chat: chat_rooms, chat_room_members, chat_messages, private_messages, reactions, pins
Places/Events: places, reviews, events, event_registrations
Notifications: notifications, push_subscriptions, admin_broadcasts
AIT: ait_balances, ait_transactions, quests, entitlements, fund cycles
Platform expansion (migration 0003): user_passport_stamps, user_trust_scores, user_vouches, ai_copilot_sessions, stripe_connect_accounts, creator_applications, launch_waitlist
Trips marketplace: поля forked_from_trip_id, price_cents, is_for_sale в trips
Fallback без БД: MemStorage в server/storage.ts — in-memory для локальной разработки (данные сбрасываются).

Миграции: npm run db:migrate (4 миграции, последняя — 0003_platform_expansion.sql).

7. Ключевые фичи — как работают технически
Карта
TravelMap — абстракция провайдеров (Yandex → Mapbox → Leaflet)
POI: GET /api/map/pois
Геокодинг: мульти-провайдерный стек в server/geo/ (локальная БД → Yandex → Nominatim → Photon)
Маршруты в поездках: Yandex Router API → геометрия на карте
Поездки
CRUD + waypoints с orderIndex и dayNumber
Публичные маршруты: GET /api/trips/:id/public (SEO-страница)
Копирование: POST /api/trips/:id/copy или /fork с attribution
Invite links: токены в trip_invites
Route matches: поиск друзей на похожих маршрутах
Trip Cinema: immersive playback маршрута
Чат
Группы: public/private, роли (owner/admin/member), invite links
DM: private_messages с реакциями
Realtime: WS локально; на Vercel — polling + push
Медиа: Vercel Blob (prod) или /uploads (dev); allowlist URL для GIF
Соцлента
Форматы: post, story, reel, journal
Режимы: all, following, popular, nearby (haversine по координатам поста)
AIT: tips авторам, boost постов, creator spotlight
Travel Passport
Синхронизация штампов из trips.destination (парсинг «город, страна»)
API: /api/passport/me, /api/passport/public/:username
Achievements: explorer, globetrotter, world_citizen и др.
Trust
Score = f(trips, reviews, vouches, verified)
POST /api/trust/:userId/vouch — подтверждение от другого пользователя
Marketplace
Владелец выставляет маршрут: PATCH /api/trips/:id/marketplace
Покупатель: fork + опционально Stripe Checkout (15% platform fee)
Stripe Connect onboarding для креаторов
AI
trip-copilot.ts: OpenAI JSON response или keyword-эвристика
Multi-turn: сессии в ai_copilot_sessions
Companion match: скоринг по интересам профиля + совпадение destination
AIT Wallet (/wallet)
Не fintech — gamification: spend balance + creator balance
Начисления за посты, чат, друзей, логины, квесты
Траты: themes, perks, tips, boosts
8. Инфраструктура и деплой
Компонент	Решение
Hosting
Vercel (SPA + serverless API)
DB
Neon PostgreSQL
Media
Vercel Blob
CI
GitHub Actions: tsc, eslint, prettier, vitest, build
E2E
Playwright (4 spec: chat, notifications)
DNS
allintravel.online → Vercel
Локально: один процесс npm run dev на порту 5000 (API + Vite HMR + WebSocket).

Prod на Vercel: WebSocket недоступен → чат через HTTP; push через VAPID.

9. Интеграции (внешние сервисы)
Сервис	Для чего
Yandex Maps/Geo/Router
Карты, подсказки, маршруты (RU/CIS)
Mapbox / Leaflet
Fallback карт
Nominatim / Photon
OSM-геокодинг
OpenAI
Trip Copilot (опционально)
Stripe
Marketplace payouts (опционально)
ЮKassa
Оплата событий (mock без ключей)
Vercel Blob
Загрузки медиа
Web Push (VAPID)
Push-уведомления
Google OAuth
Вход через Google
Jamendo / iTunes
Поиск музыки
Upstash Redis
Cross-instance realtime (опционально)
Affiliate
Ostrovok/Booking hotel links
10. Качество и тесты
63 unit/integration теста (Vitest + Supertest)
ESLint 0 warnings policy
TypeScript strict check в CI
IStorage abstraction — единый интерфейс PG + MemStorage
11. Краткое резюме одной фразой
allintravel — это full-stack social-travel super-app: карта + планировщик маршрутов + соцсеть + Telegram-grade мессенджер + gamification (AIT) + travel passport + reputation + creator marketplace, написанный на React/Express/PostgreSQL, задеплоенный на Vercel + Neon, с траекторией роста в международную life-work-travel платформу.