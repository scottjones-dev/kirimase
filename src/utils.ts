import fs, { existsSync } from "node:fs";
import path from "node:path";
import { consola } from "consola";
import { execa } from "execa";
import { spinner } from "./commands/add/index.js";
import { assertNoLegacyAuthConfig } from "./legacy-auth.js";
import type {
  AvailablePackage,
  Config,
  PMType,
  UpdateConfig,
} from "./types.js";

export const delay = (ms = 2000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function createFile(filePath: string, content: string) {
  const resolvedPath = path.resolve(filePath);
  const dirName = path.dirname(resolvedPath);

  // Check if the directory exists
  if (!fs.existsSync(dirName)) {
    // If not, create the directory and any nested directories that might be needed
    fs.mkdirSync(dirName, { recursive: true });
    // consola.success(`Directory ${dirName} created.`);
  }

  fs.writeFileSync(resolvedPath, content);
  // TODO - add flag for verbose
  // consola.success(`File created at ${filePath}`);
}

export function replaceFile(filePath: string, content: string, log = true) {
  const resolvedPath = path.resolve(filePath);
  const dirName = path.dirname(resolvedPath);

  // Check if the directory exists
  if (!fs.existsSync(dirName)) {
    // If not, create the directory and any nested directories that might be needed
    fs.mkdirSync(dirName, { recursive: true });
    // consola.success(`Directory ${dirName} created.`);
  }

  fs.writeFileSync(resolvedPath, content);
  if (log === true) {
    // TODO as above
    // consola.success(`File replaced at ${filePath}`);
  }
}

export function createFolder(relativePath: string, log = false) {
  const fullPath = path.join(process.cwd(), relativePath);
  fs.mkdirSync(fullPath, { recursive: true });
  if (log) {
    // TODO as above
    // consola.success(`Folder created at ${fullPath}`);
  }
}

export const runCommand = async (command: string, args: string[]) => {
  const formattedArgs = args.filter((a) => a !== "");
  try {
    await execa(command, formattedArgs, {
      stdio: "inherit",
    });
  } catch (error) {
    throw new Error(
      `Command "${command} ${formattedArgs.join(" ").trim()}" failed`,
      { cause: error }
    );
  }
};

const PNPM_WORKSPACE_FILE = "pnpm-workspace.yaml";
const DANGEROUSLY_ALLOW_ALL_BUILDS_KEY = "dangerouslyAllowAllBuilds";

// pnpm v10+ blocks dependency postinstall/build scripts by default (its
// "ignored builds" supply-chain gate) unless explicitly approved. Left
// unhandled, packages like esbuild (pulled in transitively by drizzle-kit
// and other devDependencies) fail to install and the whole install fails
// with no obvious cause. This project is fully owned by the person running
// the CLI, so allowing all builds here is a reasonable default; pnpm's own
// `pnpm approve-builds` remains available for anyone who wants to be more
// selective afterward.
export function ensurePnpmBuildsAllowed(pmType: PMType) {
  if (pmType !== "pnpm") {
    return;
  }
  const workspacePath = path.resolve(PNPM_WORKSPACE_FILE);
  if (!existsSync(workspacePath)) {
    fs.writeFileSync(
      workspacePath,
      `${DANGEROUSLY_ALLOW_ALL_BUILDS_KEY}: true\n`
    );
    return;
  }
  const existing = fs.readFileSync(workspacePath, "utf-8");
  if (!existing.includes(DANGEROUSLY_ALLOW_ALL_BUILDS_KEY)) {
    fs.writeFileSync(
      workspacePath,
      `${existing.trimEnd()}\n${DANGEROUSLY_ALLOW_ALL_BUILDS_KEY}: true\n`
    );
  }
}

export async function installPackages(
  packages: { regular: string; dev: string },
  pmType: PMType
) {
  const installCommand = pmType === "npm" ? "install" : "add";

  spinner.stop();
  consola.info("Installing Dependencies");
  if (packages.regular) {
    await runCommand(
      pmType,
      [installCommand].concat(packages.regular.split(" "))
    );
  }
  if (packages.dev) {
    await runCommand(
      pmType,
      [installCommand, "-D"].concat(packages.dev.split(" "))
    );
  }
}

export const createConfigFile = (options: Config) => {
  createFile("./gennext.config.json", JSON.stringify(options, null, 2));
};

export const updateConfigFile = (options: UpdateConfig) => {
  const config = readConfigFile();
  const newConfig = { ...config, ...options };
  replaceFile(
    "./gennext.config.json",
    JSON.stringify(newConfig, null, 2),
    false
  );
};

export const readConfigFile = (): (Config & { rootPath: string }) | null => {
  // Define the path to package.json
  const configPath = path.join(process.cwd(), "gennext.config.json");

  if (!fs.existsSync(configPath)) {
    return null;
  }
  // Read package.json
  const configJsonData = fs.readFileSync(configPath, "utf-8");

  // Parse package.json content
  const parsedConfig: unknown = JSON.parse(configJsonData);
  assertNoLegacyAuthConfig(parsedConfig);
  const config = parsedConfig as Config;

  const rootPath = config.hasSrc ? "src/" : "";
  return { ...config, rootPath };
};

export const addPackageToConfig = (packageName: AvailablePackage) => {
  const config = readConfigFile();
  updateConfigFile({ packages: [...config.packages, packageName] });
};

export const wrapInParenthesis = (string: string) => `(${string})`;

// shadcn specific utils

export const pmInstallCommand = {
  bun: "bunx",
  npm: "npx",
  pnpm: "pnpm",
  yarn: "npx",
};

export async function installShadcnUIComponents(
  components: string[]
): Promise<void> {
  const { preferredPackageManager, hasSrc } = readConfigFile();
  const componentsToInstall: string[] = [];

  for (const component of components) {
    const tsxFilePath = path.resolve(
      `${hasSrc ? "src/" : ""}components/ui/${component}.tsx`
    );

    if (!existsSync(tsxFilePath)) {
      componentsToInstall.push(component);
    }
  }
  const baseArgs = ["shadcn@latest", "add", ...componentsToInstall];
  const installArgs =
    preferredPackageManager === "pnpm" ? ["dlx", ...baseArgs] : baseArgs;

  if (componentsToInstall.length > 0) {
    // consola.start(
    //   `Installing shadcn-ui components: ${componentsToInstall.join(", ")}`
    // );
    try {
      spinner.stop();
      consola.info("Installing ShadcnUI Components");
      await execa(pmInstallCommand[preferredPackageManager], installArgs, {
        stdio: "inherit",
      });
      // consola.success(
      //   `Installed components: ${componentsToInstall.join(", ")}`
      // );
    } catch (error) {
      consola.error(`Failed to install components: ${error.message}`);
    }
  } else {
    // consola.info("All items already installed.");
  }
}

export const getFileContents = (filePath: string) => {
  const exists = fs.existsSync(filePath);
  if (!exists) {
    consola.error("File does not exist at", filePath);
    return "";
  }
  const fileContents = fs.readFileSync(filePath, "utf-8");
  return fileContents;
};

export const updateConfigFileAfterUpdate = () => {
  const { packages, orm, auth } = readConfigFile();
  if (orm === undefined || auth === undefined) {
    const updatedOrm = packages.includes("drizzle") ? "drizzle" : null;
    const updatedAuth = packages.includes("clerk") ? "clerk" : null;
    updateConfigFile({ auth: updatedAuth, orm: updatedOrm });
    consola.info("Config file updated.");
  } else {
    consola.info("Config file already up to date.");
  }
};

interface T3Deltas {
  alias: string;
  createRouterInvokcation: string;
  rootRouterName: string;
  rootRouterRelativePath: string;
  trpcRootDir: string;
}
export const getFileLocations = (): T3Deltas => {
  const { t3 } = readConfigFile();
  const t3Locations: T3Deltas = {
    alias: "~",
    createRouterInvokcation: "createTRPCRouter",
    rootRouterName: "root.ts",
    rootRouterRelativePath: "root.ts",
    trpcRootDir: "server/api/",
  };
  const regularLocations: T3Deltas = {
    alias: "@",
    createRouterInvokcation: "router",
    rootRouterName: "_app.ts",
    rootRouterRelativePath: "routers/_app.ts",
    trpcRootDir: "lib/server/",
  };
  if (t3) {
    return t3Locations;
  }
  return regularLocations;
};
