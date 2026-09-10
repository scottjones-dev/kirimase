# Changelog

## 0.1.0

- Renames the project to GenNext, a maintained fork of [Kirimase](https://github.com/nicoalbanese/kirimase) by Nico Albanese. The CLI binary, config filename (`gennext.config.json`), and package name all change accordingly; see [MIGRATION.md](MIGRATION.md).
- Removes the anonymous usage-analytics reporting that shipped in Kirimase.
- Requires Node.js 24.19.0 or newer and replaces ESLint/Prettier with Ultracite and Biome.
- Removes Auth.js/NextAuth, Lucia, and Kinde generators with explicit migration blocking for existing applications.
- Adds Better Auth with email/password, selectable social providers, Drizzle and Prisma adapters, official schema generation, shared session utilities, account UI, Stripe, and tRPC integration.
- Retains Clerk as an alternative authentication provider.

This release is intentionally breaking. GenNext does not automatically migrate application users, schemas, generated auth files, or sessions.
