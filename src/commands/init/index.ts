import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { select } from "@inquirer/prompts";
import chalk from "chalk";
import { consola } from "consola";
import figlet from "figlet";
import type { InitOptions, PMType } from "../../types.js";
import { createConfigFile } from "../../utils.js";
import { addPackage } from "../add/index.js";
import { checkForPackageManager } from "./utils.js";

export async function initProject(options?: InitOptions) {
  const nextjsProjectExists = existsSync("package.json");
  if (!nextjsProjectExists) {
    consola.fatal(
      "No Next.js project detected. Please create a Next.js project and then run `kirimase init` within that directory."
    );
    process.exit(0);
  }
  const usingAppDirWithSrc = existsSync(path.join(process.cwd(), "src/app"));
  const usingAppDirWithOutSrc = existsSync(path.join(process.cwd(), "app"));
  if (!(usingAppDirWithOutSrc || usingAppDirWithSrc)) {
    consola.fatal("Kirimase only works with the Next.js App Directory.");
    process.exit(0);
  }

  console.clear();

  console.log("\n");
  console.log(chalk(figlet.textSync("Kirimase", { font: "ANSI Shadow" })));
  const srcExists =
    usingAppDirWithSrc ??
    options.hasSrcFolder ??
    (await select({
      choices: [
        { name: "Yes", value: true },
        { name: "No", value: false },
      ],
      message: "Are you using a 'src' folder?",
    }));

  const preferredPackageManager =
    checkForPackageManager() ||
    options?.packageManager ||
    ((await select({
      choices: [
        { name: "NPM", value: "npm" },
        { name: "Yarn", value: "yarn" },
        { name: "PNPM", value: "pnpm" },
        { name: "Bun", value: "bun" },
      ],
      message: "Please pick your preferred package manager",
    })) as PMType);
  // console.log("installing dependencies with", preferredPackageManager);

  const tsConfigExists = existsSync("tsconfig.json");
  if (!tsConfigExists) {
    consola.info("No TSConfig found...");
    consola.fatal("Kirimase is only compatible with Typescript projects.");
    process.exit(0);
  }
  const tsConfigString = readFileSync("tsconfig.json", "utf-8");
  let alias = "@";
  if (tsConfigString.includes("@/*")) {
    alias = "@";
  }
  if (tsConfigString.includes("~/*")) {
    alias = "~";
  }

  createConfigFile({
    alias,
    analytics: true,
    auth: undefined,
    componentLib: undefined,
    driver: undefined,
    hasSrc: srcExists,
    orm: undefined,
    packages: [],
    preferredPackageManager,
    provider: undefined,
    t3: false,
  });
  // consola.success("Kirimase initialized!");
  // consola.info("You can now add packages.");
  addPackage(options, true);
}
