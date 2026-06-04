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

## Деплой на Vercel

1. Подключить репозиторий на [Vercel](https://vercel.com)
2. **Не указывать** Output Directory вручную — используется `vercel.json`
3. Добавить переменные окружения: `SESSION_SECRET`, `DATABASE_URL`, `APP_ACCESS_CODE`
4. Для Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`

> WebSocket-чат на Vercel не поддерживается (ограничение serverless). Остальной функционал работает.

## Стек

- React 18, Vite, Wouter, TanStack Query, Tailwind, Leaflet
- Express, Passport, Drizzle ORM, PostgreSQL
