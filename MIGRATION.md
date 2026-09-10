# Migrating authentication for Kirimase 0.1

Kirimase 0.1 removes the `next-auth`, `lucia`, and `kinde` generator values. Existing applications must migrate authentication explicitly; Kirimase does not rewrite generated files, database records, or sessions.

## Before running Kirimase 0.1

1. Create a branch and back up the application database.
2. Choose Clerk now, or Better Auth after upgrading to the completed 0.1 release.
3. Follow the destination provider's schema and environment-variable documentation.
4. Map users and linked accounts explicitly. Preserve stable application user IDs where owned-resource foreign keys depend on them.
5. Remove the legacy provider only after the replacement can create and retrieve sessions.
6. Update `kirimase.config.json` to the new provider after the application migration is complete.

Legacy sessions are expected to become invalid. Users should be told that they will need to sign in again.

Kirimase stops with this guide when it finds a removed auth value in `kirimase.config.json` or a removed auth dependency in the target application's `package.json`. It will not alter either file automatically.
