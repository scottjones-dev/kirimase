import { existsSync, readFileSync } from "node:fs";
import { consola } from "consola";
import type {
  AvailablePackage,
  Config,
  DBProvider,
  DBProviderOptions,
  DBType,
  PMType,
} from "../../types.js";
import { readConfigFile, replaceFile, updateConfigFile } from "../../utils.js";
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

export const checkForExistingPackages = async (_rootPath: string) => {
  consola.start("Checking project for existing packages...");
  // get package json
  const { preferredPackageManager } = readConfigFile();
  const packageJsonInitText = readFileSync("package.json", "utf-8");

  const configObj: Partial<Config> = {
    packages: [],
  };
  const packages: Partial<Record<AvailablePackage, string[]>> = {
    clerk: ["@clerk/nextjs"],
    drizzle: ["drizzle-orm", "drizzle-kit"],
    lucia: ["lucia"],
    "next-auth": ["next-auth", "@auth/core"],
    prisma: ["prisma"],
    resend: ["resend"],
    stripe: ["stripe", "@stripe/stripe-js"],
    trpc: ["@trpc/client", "@trpc/react-query", "@trpc/server", "@trpc/next"],
  };

  const packageTypeMappings: Partial<
    Record<AvailablePackage, "orm" | "auth" | null>
  > = {
    clerk: "auth",
    drizzle: "orm",
    lucia: "auth",
    "next-auth": "auth",
    prisma: "orm",
    resend: null,
    stripe: null,
    trpc: null,
  };

  const pkgDependencies = JSON.parse(packageJsonInitText);
  const allDependencies = {
    dev: pkgDependencies.devDependencies,
    regular: pkgDependencies.dependencies,
  };
  const dependenciesStringified = JSON.stringify(allDependencies);
  for (const [key, terms] of Object.entries(packages)) {
    // console.log(key, terms);
    if (!terms) {
      continue;
    }

    // Loop over each term in the array
    let existsInProject = false;
    for (const term of terms) {
      // Check if the term is present in the text file content
      if (dependenciesStringified.includes(term)) {
        // set object
        existsInProject = true;
        // if (packageTypeMappings[key] !== null) {
        //   configObj[packageTypeMappings[key]] = key;
        //   configObj.packages.push(key as AvailablePackage);
        // }
      }
    }
    if (existsInProject && packageTypeMappings[key] !== null) {
      configObj[packageTypeMappings[key]] = key;
    }
    if (existsInProject) {
      configObj.packages.push(key as AvailablePackage);
    }
  }

  // check for shadcn ui
  const hasComponentsJson = existsSync("components.json");
  if (hasComponentsJson) {
    configObj.componentLib = "shadcn-ui";
    configObj.packages.push("shadcn-ui");
  }

  // check for driver
  // prisma: check schema for provider value
  // drizzle: check package json
  const providerMappings: Record<DBProvider, string> = {
    aws: "",
    "better-sqlite3": "better-sqlite3",
    "mysql-2": "mysql2",
    neon: "@neondatabase/serverless",
    "node-postgres": "pg",
    planetscale: "@planetscale/database",
    postgresjs: "postgres",
    supabase: "pg", // fix later
    turso: "@libsql/client",
    "vercel-pg": "@vercel/postgres",
  };
  const providerDriverMappings: Record<DBProvider, DBType> = {
    aws: "pg",
    "better-sqlite3": "sqlite",
    "mysql-2": "mysql",
    neon: "pg",
    "node-postgres": "pg",
    planetscale: "mysql",
    postgresjs: "pg",
    supabase: "pg", // fix later
    turso: "sqlite",
    "vercel-pg": "pg",
  };
  for (const [key, term] of Object.entries(providerMappings)) {
    // console.log(key, terms);
    if (!term) {
      continue;
    }

    // Loop over each term in the array
    let existsInProject = false;

    if (dependenciesStringified.includes(term)) {
      existsInProject = true;
    }
    if (existsInProject && providerMappings[key] !== null) {
      configObj.provider = key as DBProvider;
      configObj.driver = providerDriverMappings[key];
    }
  }

  // updated check (nov 2023) for ct3a
  packageJsonInitText.includes("ct3aMetadata")
    ? (configObj.t3 = true)
    : (configObj.t3 = false);

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
  if (configObj.orm === "prisma") {
    const schemaFile = readFileSync("prisma/schema.prisma");
    schemaFile.includes(`provider = "sqlite"`)
      ? (configObj.driver = "sqlite")
      : null;

    schemaFile.includes(`provider = "postgresql"`)
      ? (configObj.driver = "pg")
      : null;

    if (schemaFile.includes(`provider = "mysql"`)) {
      configObj.driver = "mysql";
      if (schemaFile.includes(`relationMode = "prisma"`)) {
        configObj.provider = "planetscale";
      }
    }
  }

  if (configObj.t3 === true) {
    if (configObj.orm === "prisma") {
      // add zod generator to schema to schema.prisma
      // consola.start(
      //   "Installing zod-prisma for use with Kirimase's generate function."
      // );
      addToInstallList({ dev: ["zod-prisma"], regular: [] });
      // await installPackages(
      //   { regular: "", dev: "zod-prisma" },
      //   preferredPackageManager,
      // );
      addZodGeneratorToPrismaSchema();
      // consola.success("Successfully installed!");

      await updateTsConfigPrismaTypeAlias();
    } else if (configObj.orm === "drizzle") {
      // consola.start(
      //   "Installing drizzle-zod for use with Kirimase's generate function."
      // );
      // await installPackages(
      //   { regular: "drizzle-zod", dev: "" },
      //   preferredPackageManager
      // );
      addToInstallList({ dev: [], regular: ["drizzle-zod", "nanoid"] });
      addNanoidToUtils();
      // consola.success("Successfully installed!");
    }
  }
  // if (drizzle), check if using one schema file or schema directory - perhaps just force users?

  // update config file
  updateConfigFile(configObj);
};

const addZodGeneratorToPrismaSchema = () => {
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
};

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

export const toggleAnalytics = (input: { toggle?: boolean }) => {
  const { analytics } = readConfigFile();

  if (input.toggle) {
    updateConfigFile({ analytics: !analytics });

    consola.info(`Anonymous analytics are now ${analytics ? "off" : "on"}`);
  } else {
    consola.info(
      `Anonymous analytics are currently ${analytics ? "on" : "off"}`
    );
  }
};
