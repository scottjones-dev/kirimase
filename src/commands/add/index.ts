import { confirm } from "@inquirer/prompts";
import { consola } from "consola";
import ora from "ora";
import type { InitOptions, ORMType } from "../../types.js";
import {
  readConfigFile,
  replaceFile,
  sendEvent,
  updateConfigFile,
} from "../../utils.js";
import { formatFilePath, getFilePaths } from "../filePaths/index.js";
import { initProject } from "../init/index.js";
import { checkForExistingPackages } from "../init/utils.js";
import { addClerk } from "./auth/clerk/index.js";
import { addKinde } from "./auth/kinde/index.js";
import { addLucia } from "./auth/lucia/index.js";
import { addNextAuth } from "./auth/next-auth/index.js";
import { checkAndAddAuthUtils } from "./auth/next-auth/utils.js";
import { createAccountSettingsPage } from "./auth/shared/index.js";
import { installShadcnUI } from "./componentLib/shadcn-ui/index.js";
import {
  createAppLayoutFile,
  createAuthLayoutFile,
  createLandingPage,
  generateGenericHomepage,
  generateGlobalsCss,
  generateUpdatedTWConfig,
} from "./misc/defaultStyles/generators.js";
import { addNavbarAndSettings } from "./misc/navbar/generators.js";
import { addResend } from "./misc/resend/index.js";
import { addStripe } from "./misc/stripe/index.js";
import { addTrpc } from "./misc/trpc/index.js";
import { addDrizzle } from "./orm/drizzle/index.js";
import { addPrisma } from "./orm/prisma/index.js";
import {
  askAuth,
  askAuthProvider,
  askComponentLib,
  askDbProvider,
  askDbType,
  askMiscPackages,
  askOrm,
  askPscale,
} from "./prompts.js";
import {
  addAuthCheckToAppLayout,
  addContextProviderToAppLayout,
  addToInstallList,
  installPackagesFromList,
  installShadcnComponentList,
  printNextSteps,
} from "./utils.js";

type ProjectConfig = ReturnType<typeof readConfigFile>;

const askForOrm = async (config: ProjectConfig, options?: InitOptions) => {
  let orm: ORMType | null | undefined = config.orm
    ? undefined
    : await askOrm(options);
  if (orm !== null) {
    return orm;
  }

  const confirmedNoOrm = await confirm({
    message:
      "Are you sure you don't want to install an ORM? Note: you will not be able to install auth or Stripe.",
  });
  if (!confirmedNoOrm) {
    orm = await askOrm(options);
  }
  return orm;
};

const promptUser = async (options?: InitOptions): Promise<InitOptions> => {
  const config = readConfigFile();
  // console.log(config);

  // prompt component lib
  const componentLib = config.componentLib
    ? undefined
    : await askComponentLib(options);

  // prompt orm
  const orm = await askForOrm(config, options);

  // prompt db type
  const dbType =
    orm === null || config.driver ? undefined : await askDbType(options);

  const shouldAskForProvider = !(
    config.orm ||
    orm === "prisma" ||
    orm === null ||
    (config.driver && config.t3) ||
    (config.provider && !config.t3)
  );
  let dbProvider = shouldAskForProvider
    ? await askDbProvider(options, dbType, config.preferredPackageManager)
    : undefined;

  if (orm === "prisma" && dbType === "mysql") {
    const usePscale = await askPscale(options);
    if (usePscale) {
      dbProvider = "planetscale";
    }
  }

  const auth = config.auth || !orm ? undefined : await askAuth(options);

  const authProviders =
    auth === "next-auth"
      ? options?.authProviders || (await askAuthProvider())
      : undefined;

  const hasOrmAndAuth = !!(
    config.auth ||
    (auth && auth !== null && (config.orm || (orm && orm !== null)))
  );
  const packagesToInstall =
    options.miscPackages ||
    (await askMiscPackages(config.packages, hasOrmAndAuth));

  return {
    auth,
    authProviders,
    componentLib,
    db: dbType,
    dbProvider,
    miscPackages: packagesToInstall,
    orm,
  };
};

export const spinner = ora();

const configureComponentLibrary = async (
  config: ProjectConfig,
  response: InitOptions,
  options?: InitOptions
) => {
  if (config.componentLib !== undefined) {
    return;
  }

  if (response.componentLib === "shadcn-ui") {
    spinner.text = "Configuring Shadcn-UI";
    await installShadcnUI([], options);
  } else if (response.componentLib === null) {
    if (options?.headless === undefined) {
      spinner.text = "Configuring Base Styles";
      const { shared } = getFilePaths();
      addToInstallList({ dev: [], regular: ["lucide-react"] });
      replaceFile("tailwind.config.ts", generateUpdatedTWConfig());
      replaceFile(
        formatFilePath(shared.init.globalCss, {
          prefix: "rootPath",
          removeExtension: false,
        }),
        generateGlobalsCss()
      );
    }
    updateConfigFile({ componentLib: null });
  }

  if (!config.t3 && options?.headless === undefined) {
    addContextProviderToAppLayout("Navbar");
  }
};

const configureOrm = async (
  config: ProjectConfig,
  response: InitOptions,
  options?: InitOptions
) => {
  if (config.orm !== undefined) {
    return;
  }
  if (response.orm === "drizzle") {
    spinner.text = "Configuring Drizzle ORM";
    await addDrizzle(
      response.db,
      response.dbProvider,
      response.includeExample,
      options
    );
  } else if (response.orm === "prisma") {
    spinner.text = "Configuring Prisma";
    await addPrisma(response.includeExample, response.db, options);
  } else {
    updateConfigFile({ driver: null, orm: null, provider: null });
  }
};

const configureAuth = async (
  config: ProjectConfig,
  response: InitOptions,
  options?: InitOptions
) => {
  if (config.auth !== undefined) {
    return;
  }
  const { shared } = getFilePaths();
  if (response.auth) {
    spinner.text = `Configuring ${response.auth[0].toUpperCase()}${response.auth.slice(1)}`;
    if (options?.headless === undefined) {
      createAuthLayoutFile();
    }
  }

  switch (response.auth) {
    case "next-auth":
      await addNextAuth(response.authProviders, options);
      break;
    case "clerk":
      await addClerk(options);
      break;
    case "lucia":
      await addLucia(options);
      break;
    case "kinde":
      await addKinde(options);
      break;
    default:
      if (options?.headless === undefined) {
        replaceFile(
          formatFilePath(shared.init.dashboardRoute, {
            prefix: "rootPath",
            removeExtension: false,
          }),
          generateGenericHomepage()
        );
      }
      updateConfigFile({ auth: null });
      break;
  }

  if (response.auth && options?.headless === undefined) {
    await createAccountSettingsPage();
    addAuthCheckToAppLayout();
  }
  if (options?.headless === undefined) {
    addNavbarAndSettings();
  }
};

const configureMiscPackages = async (
  response: InitOptions,
  options?: InitOptions
) => {
  const packages = response.miscPackages ?? [];
  if (packages.includes("trpc")) {
    spinner.text = "Configuring tRPC";
    await addTrpc(options);
  }
  if (packages.includes("shadcn-ui")) {
    await installShadcnUI(packages, options);
  }
  if (packages.includes("resend")) {
    spinner.text = "Configuring Resend";
    await addResend(packages, options);
  }
  if (packages.includes("stripe")) {
    spinner.text = "Configuring Stripe";
    await addStripe(packages, options);
  }
};

export const addPackage = async (options?: InitOptions, init = false) => {
  const initialConfig = readConfigFile();

  if (initialConfig) {
    if (initialConfig.packages.length === 0) {
      await checkForExistingPackages(initialConfig.rootPath);
    }
    const config = readConfigFile();
    console.log("\n");
    const promptResponse = await promptUser(options);
    const start = Date.now();
    spinner.start();
    spinner.text = "Beginning Configuration Process";

    if (options?.headless === undefined) {
      createAppLayoutFile();
      createLandingPage();
    }
    await configureComponentLibrary(config, promptResponse, options);
    await configureOrm(config, promptResponse, options);
    await configureAuth(config, promptResponse, options);
    await configureMiscPackages(promptResponse, options);

    if (config.t3 && config.auth === "next-auth") {
      checkAndAddAuthUtils();
    }

    spinner.text = "Finishing configuration";
    if (init === true) {
      await sendEvent("init_config", {});
    } else {
      await sendEvent("add_package", {
        newPackages: promptResponse.miscPackages ?? [],
      });
    }

    spinner.succeed("Configuration complete");

    await installPackagesFromList();
    await installShadcnComponentList();

    const end = Date.now();
    const duration = end - start;

    printNextSteps(promptResponse, duration, options);
  } else {
    consola.warn("No config file found, initializing project...");
    initProject(options);
  }
};
