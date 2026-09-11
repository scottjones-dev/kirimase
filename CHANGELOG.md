# Changelog

## 0.3.0

### Minor Changes

- [#2](https://github.com/scottjones-dev/gennext/pull/2) [`4b83c88`](https://github.com/scottjones-dev/gennext/commit/4b83c88333007863dc47b0c62e36e495e84f61da) Thanks [@scottjones-dev](https://github.com/scottjones-dev)! - Rework the Resend integration's email templates to use `@react-email/components` instead of hand-rolled JSX, adding a shared `EmailLayout` component alongside `FirstEmail`. Also lays the type/config/file-path groundwork (`sentry`, `posthog`, `storage` package slots) for upcoming integrations.

## 0.2.0

### Minor Changes

- [`4a087f0`](https://github.com/scottjones-dev/gennext/commit/4a087f09ac1792cac9c89d21e39d59786a0864c6) Thanks [@scottjones-dev](https://github.com/scottjones-dev)! - Migrate generated shadcn/ui setup to Tailwind v4 and shadcn's current CLI conventions (CSS-first `@theme` config instead of `tailwind.config.ts`, OKLCH colors, the `radix-vega` style, updated `components.json` schema). Projects scaffolded before this release used Tailwind v3 conventions that no longer match what `create-next-app` and the `shadcn` CLI produce today.

### Patch Changes

- [`4a087f0`](https://github.com/scottjones-dev/gennext/commit/4a087f09ac1792cac9c89d21e39d59786a0864c6) Thanks [@scottjones-dev](https://github.com/scottjones-dev)! - Fix a crash where a failed dependency install (e.g. pnpm blocking a package's build script) was silently swallowed and surfaced later as an unrelated, uncaught error. Install failures now propagate immediately with a clean error message, and `gennext` writes `pnpm-workspace.yaml` with `dangerouslyAllowAllBuilds: true` into scaffolded pnpm projects to prevent that specific pnpm gate from blocking installs in the first place.

## 0.1.0

- Renames the project to GenNext, a maintained fork of [Kirimase](https://github.com/nicoalbanese/kirimase) by Nico Albanese. The CLI binary, config filename (`gennext.config.json`), and package name all change accordingly; see [MIGRATION.md](MIGRATION.md).
- Removes the anonymous usage-analytics reporting that shipped in Kirimase.
- Requires Node.js 24.19.0 or newer and replaces ESLint/Prettier with Ultracite and Biome.
- Removes Auth.js/NextAuth, Lucia, and Kinde generators with explicit migration blocking for existing applications.
- Adds Better Auth with email/password, selectable social providers, Drizzle and Prisma adapters, official schema generation, shared session utilities, account UI, Stripe, and tRPC integration.
- Retains Clerk as an alternative authentication provider.

This release is intentionally breaking. GenNext does not automatically migrate application users, schemas, generated auth files, or sessions.
