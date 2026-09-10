import assert from "node:assert/strict";
import test from "node:test";
import { clerkGenerators } from "../dist/commands/add/auth/clerk/generators.js";
import { authUsesDatabaseUser } from "../dist/commands/add/auth/shared/integration.js";
import { generateSubscriptionsDrizzleSchema } from "../dist/commands/add/misc/stripe/generators.js";
import { Packages } from "../dist/commands/add/utils.js";
import {
  assertNoLegacyAuthConfig,
  assertNoLegacyAuthDependencies,
  LegacyAuthMigrationError,
} from "../dist/legacy-auth.js";

const AUTH_SESSION_PATTERN = /export type AuthSession/;
const GET_USER_AUTH_PATTERN = /export const getUserAuth/;
const CHECK_AUTH_PATTERN = /export const checkAuth/;
const AUTH_SCHEMA_IMPORT_PATTERN = /from "\.\/auth"/;
const USER_REFERENCE_PATTERN = /references\(\(\) => users\.id\)/;

test("only Better Auth and Clerk are selectable after removing legacy auth", () => {
  assert.deepEqual(Packages.auth, [
    { name: "Better Auth", value: "better-auth" },
    { name: "Clerk", value: "clerk" },
  ]);
  assert.equal(authUsesDatabaseUser("clerk"), false);
  assert.equal(authUsesDatabaseUser("better-auth"), true);
});

for (const auth of ["next-auth", "lucia", "kinde"]) {
  test(`legacy '${auth}' configs produce a migration error`, () => {
    assert.throws(
      () => assertNoLegacyAuthConfig({ auth }),
      (error) =>
        error instanceof LegacyAuthMigrationError &&
        error.message.includes("MIGRATION.md")
    );
  });
}

test("legacy dependencies produce a migration error", () => {
  assert.throws(
    () => assertNoLegacyAuthDependencies({ "next-auth": "4.24.0" }),
    LegacyAuthMigrationError
  );
});

test("Clerk dependencies are accepted", () => {
  assert.doesNotThrow(() =>
    assertNoLegacyAuthDependencies({ "@clerk/nextjs": "latest" })
  );
});

test("Clerk retains the shared server-session interface", () => {
  const authUtilities = clerkGenerators.generateAuthUtilsTs();
  assert.match(authUtilities, AUTH_SESSION_PATTERN);
  assert.match(authUtilities, GET_USER_AUTH_PATTERN);
  assert.match(authUtilities, CHECK_AUTH_PATTERN);
});

test("Stripe uses provider-neutral user ownership for Clerk", () => {
  const schema = generateSubscriptionsDrizzleSchema("pg", "clerk");
  assert.doesNotMatch(schema, AUTH_SCHEMA_IMPORT_PATTERN);
  assert.doesNotMatch(schema, USER_REFERENCE_PATTERN);
});
