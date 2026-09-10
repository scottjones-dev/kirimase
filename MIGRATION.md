# Migrating to GenNext 0.1

GenNext is a maintained fork of [Kirimase](https://github.com/nicoalbanese/kirimase) by Nico Albanese, continuing development after the original project went dormant. If you have an existing project scaffolded with Kirimase:

- Rename `kirimase.config.json` to `gennext.config.json` (same contents, no other changes needed).
- Replace the `kirimase` CLI binary with `gennext` (`npm install -g gennext`).
- Kirimase's anonymous usage-analytics reporting has been removed entirely; there is nothing to opt out of.

## Migrating authentication for GenNext 0.1

GenNext 0.1 removes the `next-auth`, `lucia`, and `kinde` generator values. Existing applications must migrate authentication explicitly; GenNext does not rewrite generated files, database records, or sessions.

## Before running GenNext 0.1

1. Create a branch and back up the application database.
2. Choose Clerk now, or Better Auth after upgrading to the completed 0.1 release.
3. Follow the destination provider's schema and environment-variable documentation.
4. Map users and linked accounts explicitly. Preserve stable application user IDs where owned-resource foreign keys depend on them.
5. Remove the legacy provider only after the replacement can create and retrieve sessions.
6. Update `gennext.config.json` to the new provider after the application migration is complete.

## Better Auth environment variables

Replace legacy auth variables with `BETTER_AUTH_URL` and a new `BETTER_AUTH_SECRET` containing at least 32 cryptographically random characters. Add `<PROVIDER>_CLIENT_ID` and `<PROVIDER>_CLIENT_SECRET` for each selected Apple, Discord, GitHub, or Google provider. OAuth callback paths use `/api/auth/callback/<provider>`.

## Schema generation and migration

GenNext runs the pinned official `auth generate` command after installing dependencies. Drizzle schema is written to the configured auth-schema module; Prisma models are merged into `prisma/schema.prisma`. Review the generated diff, then run the migration command printed by GenNext. No database migration is applied automatically.

Move user, account, and credential data manually. Existing password hashes are reusable only when their algorithm and parameters are compatible with the destination configuration. Preserve user IDs before reconnecting owned-resource foreign keys.

Legacy sessions are expected to become invalid. Users should be told that they will need to sign in again.

GenNext stops with this guide when it finds a removed auth value in `gennext.config.json` or a removed auth dependency in the target application's `package.json`. It will not alter either file automatically.
