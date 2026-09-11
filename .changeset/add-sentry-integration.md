---
"gennext": minor
---

Add a Sentry integration (`gennext add` → misc packages → Sentry). Generates `instrumentation.ts` (server + edge init) and `instrumentation-client.ts` (browser init), wraps the project's `next.config.{ts,mjs,js}` with `withSentryConfig` when its default export shape can be confidently patched (falling back to a manual next-step note otherwise), and adds optional `NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` env vars.
