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
npm run db:push
npm run db:seed
```

Без `DATABASE_URL` используется in-memory хранилище (данные сбрасываются при перезапуске).

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
| `APP_ACCESS_CODE` | да | Общий код входа на `/login`, например `demo` |
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

> WebSocket-чат на Vercel не поддерживается (ограничение serverless). Остальной функционал работает.

## Стек

- React 18, Vite, Wouter, TanStack Query, Tailwind, Leaflet
- Express, Passport, Drizzle ORM, PostgreSQL
