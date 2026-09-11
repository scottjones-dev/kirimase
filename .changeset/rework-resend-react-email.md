---
"gennext": minor
---

Rework the Resend integration's email templates to use `@react-email/components` instead of hand-rolled JSX, adding a shared `EmailLayout` component alongside `FirstEmail`. Also lays the type/config/file-path groundwork (`sentry`, `posthog`, `storage` package slots) for upcoming integrations.
