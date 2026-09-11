import { existsSync, readFileSync } from "node:fs";
import { consola } from "consola";
import { assertNoLegacyAuthDependencies } from "../../legacy-auth.js";
import type {
  AuthType,
  AvailablePackage,
  Config,
  DBProvider,
  DBProviderOptions,
  DBType,
  ORMType,
  PMType,
} from "../../types.js";
import { replaceFile, updateConfigFile } from "../../utils.js";
import { addNanoidToUtils } from "../add/orm/drizzle/utils.js";
import { updateTsConfigPrismaTypeAlias } from "../add/orm/utils.js";
import { addToInstallList } from "../add/utils.js";
// test

export const DBProviders: DBProviderOptions = {
  mysql: [
    { name: "PlanetScale", value: "planetscale" },
    { name: "MySQL 2", value: "mysql-2" },
  ],
  pg: [
    { name: "Postgres.JS", value: "postgresjs" },
    { name: "node-postgres", value: "node-postgres" },
    { name: "Neon", value: "neon" },
    { name: "Vercel Postgres", value: "vercel-pg" },
    { name: "Supabase", value: "supabase" },
    {
      disabled: "(Not supported)",
      name: "AWS Data API",
      value: "aws",
    },
  ],
  sqlite: [
    { name: "better-sqlite3", value: "better-sqlite3" },
    { name: "turso", value: "turso" },
    // { name: "Bun SQLite", value: "bun-sqlite" },
  ],
};

const packageSignatures: Partial<Record<AvailablePackage, string[]>> = {
  "better-auth": ["better-auth"],
  clerk: ["@clerk/nextjs"],
  drizzle: ["drizzle-orm", "drizzle-kit"],
  posthog: ["posthog-js"],
  prisma: ["prisma"],
  resend: ["resend"],
  sentry: ["@sentry/nextjs"],
  storage: ["@aws-sdk/client-s3"],
  stripe: ["stripe", "@stripe/stripe-js"],
  trpc: ["@trpc/client", "@trpc/react-query", "@trpc/server", "@trpc/next"],
};

const packageCategories: Partial<
  Record<AvailablePackage, "orm" | "auth" | null>
> = {
  "better-auth": "auth",
  clerk: "auth",
  drizzle: "orm",
  posthog: null,
  prisma: "orm",
  resend: null,
  sentry: null,
  storage: null,
  stripe: null,
  trpc: null,
};

const providerSignatures: Record<DBProvider, string> = {
  aws: "",
  "better-sqlite3": "better-sqlite3",
  "mysql-2": "mysql2",
  neon: "@neondatabase/serverless",
  "node-postgres": "pg",
  planetscale: "@planetscale/database",
  postgresjs: "postgres",
  supabase: "pg",
  turso: "@libsql/client",
  "vercel-pg": "@vercel/postgres",
};

const providerDrivers: Record<DBProvider, DBType> = {
  aws: "pg",
  "better-sqlite3": "sqlite",
  "mysql-2": "mysql",
  neon: "pg",
  "node-postgres": "pg",
  planetscale: "mysql",
  postgresjs: "pg",
  supabase: "pg",
  turso: "sqlite",
  "vercel-pg": "pg",
};

const detectPackages = (dependencies: string, config: Partial<Config>) => {
  const foundPackages: AvailablePackage[] = [];
  for (const [packageName, signatures] of Object.entries(packageSignatures)) {
    if (!signatures?.some((signature) => dependencies.includes(signature))) {
      continue;
    }
    const typedPackage = packageName as AvailablePackage;
    const category = packageCategories[typedPackage];
    if (category === "auth") {
      config.auth = typedPackage as AuthType;
    }
    if (category === "orm") {
      config.orm = typedPackage as ORMType;
    }
    foundPackages.push(typedPackage);
  }
  config.packages = foundPackages;
};

const detectDatabaseProvider = (
  dependencies: string,
  config: Partial<Config>
) => {
  for (const [provider, signature] of Object.entries(providerSignatures)) {
    if (!(signature && dependencies.includes(signature))) {
      continue;
    }
    const typedProvider = provider as DBProvider;
    config.provider = typedProvider;
    config.driver = providerDrivers[typedProvider];
  }
};

const detectPrismaDriver = (config: Partial<Config>) => {
  if (config.orm !== "prisma") {
    return;
  }
  const schema = readFileSync("prisma/schema.prisma", "utf-8");
  if (schema.includes('provider = "sqlite"')) {
    config.driver = "sqlite";
  }
  if (schema.includes('provider = "postgresql"')) {
    config.driver = "pg";
  }
  if (schema.includes('provider = "mysql"')) {
    config.driver = "mysql";
    if (schema.includes('relationMode = "prisma"')) {
      config.provider = "planetscale";
    }
  }
};

const configureT3GeneratorSupport = async (config: Partial<Config>) => {
  if (!config.t3) {
    return;
  }
  if (config.orm === "prisma") {
    addToInstallList({ dev: ["zod-prisma"], regular: [] });
    addZodGeneratorToPrismaSchema();
    await updateTsConfigPrismaTypeAlias();
  } else if (config.orm === "drizzle") {
    addToInstallList({ dev: [], regular: ["drizzle-zod", "nanoid"] });
    addNanoidToUtils();
  }
};

export const checkForExistingPackages = async (_rootPath: string) => {
  consola.start("Checking project for existing packages...");
  const packageJsonInitText = readFileSync("package.json", "utf-8");
  const configObj: Partial<Config> = { packages: [] };
  const pkgDependencies = JSON.parse(packageJsonInitText);
  const allDependencies = {
    dev: pkgDependencies.devDependencies,
    regular: pkgDependencies.dependencies,
  };
  const dependenciesStringified = JSON.stringify(allDependencies);
  assertNoLegacyAuthDependencies({
    ...(allDependencies.dev ?? {}),
    ...(allDependencies.regular ?? {}),
  });
  detectPackages(dependenciesStringified, configObj);

  // check for shadcn ui
  const hasComponentsJson = existsSync("components.json");
  if (hasComponentsJson) {
    configObj.componentLib = "shadcn-ui";
    configObj.packages?.push("shadcn-ui");
  }

  // check for driver
  // prisma: check schema for provider value
  // drizzle: check package json
  detectDatabaseProvider(dependenciesStringified, configObj);

  // updated check (nov 2023) for ct3a
  configObj.t3 = packageJsonInitText.includes("ct3aMetadata");

  if (configObj.packages.length > 0) {
    consola.success(
      "Successfully searched project and found the following packages already installed:"
    );
    consola.info(configObj.packages.map((pkg) => pkg).join(", "));
  } else {
    consola.success(
      "Successfully searched project and found no additional packages."
    );
  }

  // if (prisma) check db driver
  detectPrismaDriver(configObj);
  await configureT3GeneratorSupport(configObj);
  // if (drizzle), check if using one schema file or schema directory - perhaps just force users?

  // update config file
  updateConfigFile(configObj);
};

function addZodGeneratorToPrismaSchema() {
  const hasSchema = existsSync("prisma/schema.prisma");
  if (!hasSchema) {
    console.error("Prisma schema not found!");
    return;
  }
  const schema = readFileSync("prisma/schema.prisma", "utf-8");
  const newSchema = schema.concat(`
generator zod {
  provider              = "zod-prisma"
  output                = "./zod"
  relationModel         = true
  modelCase             = "camelCase"
  modelSuffix           = "Schema"
  useDecimalJs          = true
  prismaJsonNullability = true
}
`);

  replaceFile("prisma/schema.prisma", newSchema);
  consola.info("Updated Prisma schema");
}

export const checkForPackageManager = (): PMType | null => {
  const bun = existsSync("bun.lockb");
  const pnpm = existsSync("pnpm-lock.yaml");
  const yarn = existsSync("yarn.lock");

  if (bun) {
    return "bun";
  }
  if (pnpm) {
    return "pnpm";
  }
  if (yarn) {
    return "yarn";
  }

  return null;
};
