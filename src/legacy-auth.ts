const MIGRATION_GUIDE =
  "https://github.com/nicoalbanese/kirimase/blob/main/MIGRATION.md";

export const LEGACY_AUTH_VALUES = ["next-auth", "lucia", "kinde"] as const;
export type LegacyAuthType = (typeof LEGACY_AUTH_VALUES)[number];

const legacyDependencies: Record<LegacyAuthType, readonly string[]> = {
  kinde: ["@kinde-oss/kinde-auth-nextjs"],
  lucia: ["lucia", "@lucia-auth/adapter-drizzle", "@lucia-auth/adapter-prisma"],
  "next-auth": [
    "next-auth",
    "@auth/core",
    "@auth/drizzle-adapter",
    "@auth/prisma-adapter",
  ],
};

export class LegacyAuthMigrationError extends Error {
  constructor(auth: LegacyAuthType) {
    super(
      `Kirimase 0.1 no longer supports '${auth}'. Migrate authentication manually before continuing: ${MIGRATION_GUIDE}`
    );
    this.name = "LegacyAuthMigrationError";
  }
}

export const isLegacyAuthType = (value: unknown): value is LegacyAuthType =>
  typeof value === "string" &&
  LEGACY_AUTH_VALUES.some((legacyValue) => legacyValue === value);

export const assertNoLegacyAuthConfig = (config: unknown) => {
  if (!config || typeof config !== "object") {
    return;
  }
  const auth = Reflect.get(config, "auth");
  if (isLegacyAuthType(auth)) {
    throw new LegacyAuthMigrationError(auth);
  }
};

export const assertNoLegacyAuthDependencies = (
  dependencies: Record<string, unknown>
) => {
  for (const [auth, packageNames] of Object.entries(legacyDependencies)) {
    if (packageNames.some((packageName) => packageName in dependencies)) {
      throw new LegacyAuthMigrationError(auth as LegacyAuthType);
    }
  }
};
