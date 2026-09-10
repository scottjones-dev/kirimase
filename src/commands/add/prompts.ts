import { checkbox, confirm, Separator, select } from "@inquirer/prompts";
import { consola } from "consola";
import type {
  AuthType,
  AvailablePackage,
  ComponentLibType,
  DBProvider,
  DBType,
  InitOptions,
  ORMType,
  PackageChoice,
  PMType,
} from "../../types.js";
import { readConfigFile } from "../../utils.js";
import { DBProviders } from "../init/utils.js";
import { type AuthProvider, AuthProviders } from "./auth/next-auth/utils.js";
import { Packages } from "./utils.js";

const nullOption = { name: "None", value: null };

export const askComponentLib = async (options: InitOptions) =>
  options.componentLib ??
  ((await select({
    choices: [...Packages.componentLib, new Separator(), nullOption],
    message: "Select a component library to use:",
  })) as ComponentLibType | null);

export const askOrm = async (options: InitOptions) =>
  options.orm ??
  ((await select({
    choices: [...Packages.orm, new Separator(), nullOption],
    message: "Select an ORM to use:",
  })) as ORMType | null);

export const askDbType = async (options: InitOptions) =>
  options.db ??
  ((await select({
    choices: [
      { name: "Postgres", value: "pg" },
      {
        name: "MySQL",
        value: "mysql",
      },
      {
        name: "SQLite",
        value: "sqlite",
      },
    ],
    message: "Please choose your DB type",
  })) as DBType);

export const askDbProvider = async (
  options: InitOptions,
  dbType: DBType,
  ppm: PMType
) => {
  const dbProviders = DBProviders[dbType].filter((p) => {
    if (ppm === "bun") {
      return p.value !== "better-sqlite3";
    }
    return p.value !== "bun-sqlite";
  });
  return (
    options.dbProvider ??
    ((await select({
      choices: dbProviders,
      message: "Please choose your DB Provider",
    })) as DBProvider)
  );
};

export const askPscale = async (options: InitOptions) =>
  options.dbProvider ??
  (await confirm({
    default: false,
    message: "Are you using PlanetScale?",
  }));

export const askExampleModel = async (options: InitOptions) =>
  options.includeExample ??
  (await confirm({
    default: false,
    message:
      "Would you like to include an example model? (suggested for new users)",
  }));

export const askAuth = async (options: InitOptions) =>
  options.auth ??
  ((await select({
    choices: [...Packages.auth, new Separator(), nullOption],
    message: "Select an authentication package to use:",
  })) as AuthType | null);

export const askAuthProvider = async () =>
  (await checkbox({
    choices: Object.keys(AuthProviders).map((p) => ({ name: p, value: p })),
    message: "Select a provider to add",
  })) as AuthProvider[];

export const askMiscPackages = async (
  existingPackages: AvailablePackage[],
  hasOrmAndAuth: boolean
) => {
  let uninstalledPackages: PackageChoice[] = [];

  if (existingPackages.length === 0) {
    const { packages: packagesPostOrmAndAuth } = readConfigFile();
    uninstalledPackages = Packages.misc.filter(
      (p) => !packagesPostOrmAndAuth.includes(p.value)
    );
  } else {
    uninstalledPackages = Packages.misc.filter(
      (p) => !existingPackages.includes(p.value)
    );
  }
  if (hasOrmAndAuth === false) {
    uninstalledPackages = uninstalledPackages.map((pkg) =>
      pkg.value === "stripe"
        ? {
            ...pkg,
            disabled: "(you must have an ORM and Auth to install Stripe)",
          }
        : pkg
    );
  }

  if (uninstalledPackages.length > 0) {
    return await checkbox({
      choices: uninstalledPackages,
      message: "Select any miscellaneous packages to add:",
    });
  }
  consola.info("All available packages already installed.");
  return [];
};
