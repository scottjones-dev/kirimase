import assert from "node:assert/strict";
import test from "node:test";
import {
  generateBetterAuthClient,
  generateBetterAuthRoute,
  generateBetterAuthServer,
  generateBetterAuthUtils,
  generateEmptyDrizzleAuthSchema,
  generateSignInPage,
  generateSignUpPage,
} from "../dist/commands/add/auth/better-auth/generators.js";
import {
  getBetterAuthSchemaCommand,
  mergeBetterAuthPrismaSchema,
} from "../dist/commands/add/auth/better-auth/schema.js";
import { paths } from "../dist/commands/filePaths/index.js";

const AUTH_SESSION_PATTERN = /export type AuthSession/;
const GET_USER_AUTH_PATTERN = /export const getUserAuth/;
const CHECK_AUTH_PATTERN = /export const checkAuth/;
const DRIZZLE_ADAPTER_PATTERN = /better-auth\/adapters\/drizzle/;
const DRIZZLE_SCHEMA_IMPORT_PATTERN =
  /import \* as authSchema from "@\/lib\/db\/schema\/auth"/;
const PRISMA_ADAPTER_PATTERN = /better-auth\/adapters\/prisma/;
const AUTH_SCHEMA_REFERENCE_PATTERN = /authSchema/;
const SOCIAL_PROVIDERS_PATTERN = /socialProviders/;
const NEXTJS_HANDLER_PATTERN = /toNextJsHandler/;
const AUTH_IMPORT_PATTERN = /from "@\/lib\/auth"/;
const CREATE_AUTH_CLIENT_PATTERN = /createAuthClient/;
const BETTER_AUTH_REACT_PATTERN = /better-auth\/react/;
const GET_SESSION_CALL_PATTERN = /auth\.api\.getSession/;
const SIGN_UP_EMAIL_PATTERN = /authClient\.signUp\.email/;
const EMPTY_SCHEMA_EXPORT_PATTERN = /export \{\};/;
const DATASOURCE_PATTERN = /datasource db/;
const USER_MODEL_PATTERN = /model User/;
const SESSION_MODEL_PATTERN = /model Session/;
const PASSKEY_MODEL_PATTERN = /model Passkey/;

const baseContext = {
  authClientImport: "@/lib/auth-client",
  authSchemaImport: "@/lib/db/schema/auth",
  authServerImport: "@/lib/auth",
  dbImport: "@/lib/db",
  providers: [],
};

for (const driver of ["pg", "mysql", "sqlite"]) {
  test(`Drizzle Better Auth server config wires up the ${driver} adapter`, () => {
    const server = generateBetterAuthServer({
      ...baseContext,
      driver,
      orm: "drizzle",
    });
    assert.match(server, DRIZZLE_ADAPTER_PATTERN);
    assert.match(server, new RegExp(`provider: "${driver}"`));
    assert.match(server, DRIZZLE_SCHEMA_IMPORT_PATTERN);
  });
}

const prismaProviderNames = {
  mysql: "mysql",
  pg: "postgresql",
  sqlite: "sqlite",
};

for (const driver of ["pg", "mysql", "sqlite"]) {
  test(`Prisma Better Auth server config wires up the ${driver} adapter`, () => {
    const server = generateBetterAuthServer({
      ...baseContext,
      driver,
      orm: "prisma",
    });
    assert.match(server, PRISMA_ADAPTER_PATTERN);
    assert.match(
      server,
      new RegExp(`provider: "${prismaProviderNames[driver]}"`)
    );
    assert.doesNotMatch(server, AUTH_SCHEMA_REFERENCE_PATTERN);
  });
}

for (const provider of ["apple", "discord", "github", "google"]) {
  test(`Better Auth server config enables the ${provider} social provider`, () => {
    const server = generateBetterAuthServer({
      ...baseContext,
      driver: "pg",
      orm: "drizzle",
      providers: [provider],
    });
    assert.match(server, new RegExp(`${provider}: \\{`));
    assert.match(
      server,
      new RegExp(`process.env.${provider.toUpperCase()}_CLIENT_ID`)
    );
  });

  test(`Better Auth sign-in page renders a ${provider} button`, () => {
    const page = generateSignInPage("@/lib/auth-client", [provider]);
    assert.match(page, new RegExp(`provider: "${provider}"`));
  });
}

test("Better Auth server config omits socialProviders when none are selected", () => {
  const server = generateBetterAuthServer({
    ...baseContext,
    driver: "pg",
    orm: "drizzle",
  });
  assert.doesNotMatch(server, SOCIAL_PROVIDERS_PATTERN);
});

test("Better Auth route handler uses toNextJsHandler", () => {
  const route = generateBetterAuthRoute("@/lib/auth");
  assert.match(route, NEXTJS_HANDLER_PATTERN);
  assert.match(route, AUTH_IMPORT_PATTERN);
});

test("Better Auth client exports the react auth client", () => {
  const client = generateBetterAuthClient();
  assert.match(client, CREATE_AUTH_CLIENT_PATTERN);
  assert.match(client, BETTER_AUTH_REACT_PATTERN);
});

test("Better Auth server-session utilities match the shared auth interface", () => {
  const utilities = generateBetterAuthUtils("@/lib/auth");
  assert.match(utilities, AUTH_SESSION_PATTERN);
  assert.match(utilities, GET_USER_AUTH_PATTERN);
  assert.match(utilities, CHECK_AUTH_PATTERN);
  assert.match(utilities, GET_SESSION_CALL_PATTERN);
});

test("Better Auth sign-up page posts email and password", () => {
  const page = generateSignUpPage("@/lib/auth-client");
  assert.match(page, SIGN_UP_EMAIL_PATTERN);
});

test("empty Drizzle auth schema placeholder is a valid module", () => {
  assert.match(generateEmptyDrizzleAuthSchema(), EMPTY_SCHEMA_EXPORT_PATTERN);
});

for (const packageManager of ["npm", "pnpm", "yarn", "bun"]) {
  test(`Better Auth schema command resolves for ${packageManager}`, () => {
    const invocation = getBetterAuthSchemaCommand(
      packageManager,
      "lib/auth.ts",
      "lib/db/schema/auth.ts"
    );
    assert.equal(typeof invocation.command, "string");
    assert.ok(invocation.args.includes("generate"));
    assert.ok(invocation.args.includes("lib/auth.ts"));
    assert.ok(invocation.args.includes("lib/db/schema/auth.ts"));
  });
}

test("Prisma schema merge appends generated models to the existing schema", () => {
  const existing = 'datasource db {\n  provider = "postgresql"\n}\n';
  const generated =
    "model User {\n  id String @id\n}\n\nmodel Session {\n  id String @id\n}\n";
  const merged = mergeBetterAuthPrismaSchema(existing, generated);
  assert.match(merged, DATASOURCE_PATTERN);
  assert.match(merged, USER_MODEL_PATTERN);
  assert.match(merged, SESSION_MODEL_PATTERN);
});

test("Prisma schema merge is idempotent when re-run with no new models", () => {
  const existing =
    'datasource db {\n  provider = "postgresql"\n}\n\nmodel User {\n  id String @id\n}\n\nmodel Session {\n  id String @id\n}\n';
  const generated =
    "model User {\n  id String @id\n}\n\nmodel Session {\n  id String @id\n}\n";
  const merged = mergeBetterAuthPrismaSchema(existing, generated);
  assert.equal(merged, existing);
});

test("Prisma schema merge adds only the new models when re-run after a plugin is added", () => {
  const existing =
    'datasource db {\n  provider = "postgresql"\n}\n\nmodel User {\n  id String @id\n}\n\nmodel Session {\n  id String @id\n}\n';
  const generated =
    "model User {\n  id String @id\n}\n\nmodel Session {\n  id String @id\n}\n\nmodel Passkey {\n  id String @id\n}\n";
  const merged = mergeBetterAuthPrismaSchema(existing, generated);
  assert.match(merged, USER_MODEL_PATTERN);
  assert.match(merged, SESSION_MODEL_PATTERN);
  assert.match(merged, PASSKEY_MODEL_PATTERN);
  assert.equal(merged.match(/model User \{/g)?.length, 1);
  assert.equal(merged.match(/model Session \{/g)?.length, 1);
});

test("Prisma schema merge requires the generated schema to contain models", () => {
  assert.throws(() => mergeBetterAuthPrismaSchema("", "// nothing generated"));
});

test("Better Auth file paths are defined for both the normal and T3 layouts", () => {
  for (const layout of [paths.normal, paths.t3]) {
    assert.equal(layout.betterAuth.authServer, "lib/auth.ts");
    assert.equal(layout.betterAuth.authClient, "lib/auth-client.ts");
    assert.equal(
      layout.betterAuth.routeHandler,
      "app/api/auth/[...all]/route.ts"
    );
  }
});
