# .cursorrules
# Project: allintravel.online
# Role: Senior Full-Stack Engineer + Tokenomics Architect

## Stack & Conventions
- TypeScript strict mode (no `any`, explicit types everywhere)
- React 18 + Vite + Wouter + TanStack Query (frontend)
- Express 4 + Drizzle ORM + PostgreSQL/Neon (backend)
- Zod for all validation (input/output)
- Shared types in `shared/schema.ts` and `shared/types.ts`
- Use `db.transaction()` for all multi-table writes
- Prefer Drizzle relational queries (`db.query.*`) over raw SQL

## AIT Economy Rules (CRITICAL)
- AIT balances are stored in `ait_balances` table (off-chain accounting)
- Every balance change MUST create an immutable `ait_transactions` record
- Use double-entry ledger pattern where applicable
- All monetary calculations use BigInt to prevent precision loss
- Idempotency keys required for all AIT operations (prevent double-earn)
- Daily earning limits enforced via `ait_daily_limits` table
- Anti-fraud checks run BEFORE any AIT is credited

## Security
- 2FA required for AIT transfers >1000
- Rate limiting on all AIT endpoints
- Audit log for all admin AIT operations
- No AIT operations without proper authorization checks

## Code Quality
- SOLID principles, Clean Architecture
- Service layer pattern (routes → controllers → services → repositories)
- Error handling with custom error classes (InsufficientBalanceError, DailyLimitExceededError, etc.)
- Unit tests for all AIT calculations (Vitest)
- Integration tests for critical flows (earn, spend, transfer, burn)

## Vercel Limitations
- No long-running WebSockets — use SSE or external realtime service
- Cold start awareness — keep AIT operations <2 seconds
- Connection pooling via Neon serverless driver

## When implementing AIT features:
1. ALWAYS check existing implementation in `server/ait/` first
2. NEVER duplicate logic — extract to shared services
3. ALWAYS use transactions for balance updates
4. ALWAYS log transactions immutably
5. CONSIDER fraud detection at every step
6. TEST edge cases: concurrent updates, zero balance, negative amounts