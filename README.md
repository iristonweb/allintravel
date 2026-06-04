# All In Travel

Социальная платформа для путешественников: места, поездки, события, лента, чат и карта.

## Запуск локально

```bash
npm install
cp .env.example .env
npm run dev
```

Приложение: http://localhost:5000

## Сборка

```bash
npm run build
npm run start
```

## База данных (опционально)

```bash
# В .env указать DATABASE_URL
npm install   # drizzle-kit >= 0.31 нужен для db:push на Neon
npm run db:push
npm run db:seed
# опционально — города для автодополнения:
npm run geo:import
```

Без `DATABASE_URL` используется in-memory хранилище (данные сбрасываются при перезапуске).

### Ошибка `column "geoname_id" is in a primary key` при `db:push`

Старая версия **drizzle-kit (0.30.x)** ошибочно пыталась удалить NOT NULL-ограничения на колонке PK. Решение:

1. Обновить зависимости: `npm install` (в проекте `drizzle-kit` ^0.31).
2. Снова: `npm run db:push` — должно показать `[i] No changes detected` или применить diff без ошибки.

Если таблицы `cities` / `countries` в неконсистентном состоянии:

```bash
npm run db:reset-geo
npm run db:push
npm run geo:import
```

Предупреждение SSL от `pg` при Neon (`SECURITY WARNING: SSL modes...`) — информационное, на push/seed не влияет.

## Яндекс.Карты и Геокодер (опционально)

В `.env` (см. `.env.example`):

| Переменная | Где | Назначение |
|------------|-----|------------|
| `VITE_YANDEX_MAPS_API_KEY` | клиент (Vite) | JavaScript API карт — `/map`, планировщик |
| `YANDEX_GEOCODER_API_KEY` | сервер | Suggest + Geocoder для поля «Куда?» |

Приоритет карты: **Яндекс** → Mapbox → Leaflet.  
Приоритет подсказок: локальная БД → **Яндекс** → Nominatim.

Ключи берутся в [Кабинете разработчика Яндекс](https://developer.tech.yandex.ru/). Не коммитьте ключи в git.

## Деплой на Vercel

1. Подключить репозиторий [iristonweb/allintravel](https://github.com/iristonweb/allintravel) на [Vercel](https://vercel.com)
2. **Settings → Build:** Output Directory = **`dist/public`** (или пусто — подхватит `vercel.json`). **Не** ставьте `dist` — иначе откроется сырой `index.js` сервера вместо сайта
3. **Settings → Environment Variables** — см. таблицу ниже (можно **Import .env** и вставить содержимое локального `.env` без коммита в git)
4. После первого `DATABASE_URL` один раз локально: `npm run db:push` и `npm run db:seed`
5. Redeploy

### Переменные для Vercel (Production)

| Переменная | Обязательно | Значение |
|------------|-------------|----------|
| `DATABASE_URL` | да | Connection string из Neon (Dashboard → Connect) |
| `SESSION_SECRET` | да | Случайная длинная строка (hex 64 символа) |
| `APP_URL` | да для Google | `https://allintravel.vercel.app` |
| `GOOGLE_CLIENT_ID` | нет | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | нет | Google Cloud Console |
| `VAPID_PUBLIC_KEY` | нет | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | нет | то же |
| `VAPID_SUBJECT` | нет | `mailto:you@example.com` |
| `VITE_YANDEX_MAPS_API_KEY` | нет | JavaScript API Яндекс.Карт |
| `YANDEX_GEOCODER_API_KEY` | нет | Геокодер / Suggest (сервер) |

`NODE_ENV` и `VERCEL` Vercel выставляет сам. **Не коммитьте** `.env` в репозиторий.

### Neon

В Neon **не нужны** переменные приложения — только база:

1. Создать проект → скопировать **Connection string** (pooler, `sslmode=require`)
2. Вставить в `DATABASE_URL` на Vercel (и в локальный `.env` для `db:push` / `db:seed`)
3. При утечке пароля: Neon → **Reset password** → обновить URL везде

> **Чат на Vercel:** WebSocket недоступен на serverless; комнаты работают через **HTTP** (`POST /api/chat/:room` + опрос истории каждые 4 с). Локально по-прежнему пробуется WebSocket.

### Нужен ли второй проект на Vercel?

**Нет.** Один репозиторий и один проект Vercel — правильная схема:

| Что | Как |
|-----|-----|
| Сайт (React) | `dist/public` — CDN |
| API (`/api/*`) | `api/index.ts` → Express |
| Загрузки `/uploads` | Тот же serverless handler |

Второй проект имеет смысл только если вы **намеренно** выносите API на отдельный домен (тогда в Vercel задайте `VITE_API_ORIGIN=https://api.example.com` и настройте CORS/cookies). Для `allintravel.vercel.app` это не требуется.

### Вход и регистрация по email

Отдельной страницы «Регистрация» нет: на `/login` вводятся **email + пароль** (минимум 8 символов). При первом успешном входе пользователь **создаётся в БД** с хешем пароля. Повторный вход — тем же email и паролем. Общий код доступа не используется.

### Что работает после входа (нужен `DATABASE_URL`)

| Функция | Статус на Vercel |
|---------|------------------|
| Главная, места, поездки, события, лента, друзья, ЛС | ✅ Postgres |
| Карта | ✅ при `VITE_YANDEX_MAPS_API_KEY` (или Mapbox / Leaflet) |
| Подсказки городов | ✅ при `YANDEX_GEOCODER_API_KEY` или БД после `geo:import` |
| Чат комнат | ✅ HTTP-режим |
| Google OAuth | ✅ при `GOOGLE_*` + `APP_URL` |
| Аватар `/api/users/avatar` | ⚠️ файл на диске функции — **сбрасывается** при redeploy; для продакшена нужен S3/Vercel Blob |
| Web Push | ⚠️ подписки в памяти сервера — не для production без БД |

## Стек

- React 18, Vite, Wouter, TanStack Query, Tailwind, Leaflet
- Express, Passport, Drizzle ORM, PostgreSQL
