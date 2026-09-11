---
"gennext": minor
---

Migrate generated shadcn/ui setup to Tailwind v4 and shadcn's current CLI conventions (CSS-first `@theme` config instead of `tailwind.config.ts`, OKLCH colors, the `radix-vega` style, updated `components.json` schema). Projects scaffolded before this release used Tailwind v3 conventions that no longer match what `create-next-app` and the `shadcn` CLI produce today.
