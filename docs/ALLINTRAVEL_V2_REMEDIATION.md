# AllInTravel v2 Remediation Plan

**Status:** Source of truth #2 (after repository behavior)  
**Architecture:** Modular Monolith — evolve, never shrink

## Mandate

Preserve every user-facing capability (AI, Marketplace, Passport, Social, Chat, Music, Telegram, AIT). Improve implementation, security, scalability, maintainability, and DX. No rewrite. No unjustified microservices. Feature flags for risky cutovers. Backward compatibility whenever possible.

## Waves

| Wave | Focus | Flag gates |
|------|--------|------------|
| **0** | Platform Foundation: typed config, feature flags, migrations-only path, policy skeleton, transactional outbox, structured logs/metrics | `runtime_ddl`, `outbox_dispatch` |
| **1** | AIT closed-loop double-entry ledger | `ait_double_entry` |
| **2** | Stripe / YooKassa webhook settlement | `payments_webhooks` |
| **3** | AI authorized tools + proposal/approval | `ai_tool_proposals` |
| **4** | Social / Passport / Marketplace hardening | — |
| **5** | Chat / Telegram / Music hardening | — |

## Principles

- DDD boundaries inside the monolith; application services; repository layer where extracted
- CQRS where beneficial; domain events via outbox
- Idempotency; immutable audit; object authorization (policy); fail closed
- Zero Runtime DDL (gate then remove); migrations only
- Observability: structured logging, metrics, tracing path
- AIT is **not** cryptocurrency — closed-loop platform economy
- AI never gets unrestricted DB access; human approval before applying changes
- Marketplace: immutable route snapshots, licensed forks, permanent attribution
- Passport: evidence-based identity, verification, achievements, privacy

## Workflow (every change)

Analyse → Plan → Risks → Affected files → Implement → Tests → Report  
**One domain / foundation track per wave.**

## Default feature flags

| Key | Default | Purpose |
|-----|---------|---------|
| `runtime_ddl` | `true` | Keep ensure* safety net until parity proven |
| `outbox_dispatch` | `false` | Async side-effects via outbox |
| `ait_double_entry` | `false` | Dual-write journal entries |
| `payments_webhooks` | `false` | Webhook-driven settlement |
| `ai_tool_proposals` | `false` | Proposal + human approval gate |
