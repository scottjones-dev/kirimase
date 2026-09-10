#!/usr/bin/env node

import { Command } from "commander";
import { addPackage } from "./commands/add/index.js";
import { buildSchema } from "./commands/generate/index.js";
import { initProject } from "./commands/init/index.js";

const program = new Command();
program.name("gennext").description("GenNext CLI").version("0.1.0");

addCommonOptions(program.command("init"))
  .description("initialise and configure gennext within directory")
  .action(initProject);

program
  .command("generate")
  .description("Generate a new resource")
  .action(buildSchema);

addCommonOptions(program.command("add"))
  .description("Add and setup additional packages")
  .action(addPackage);

program.parse(process.argv);

function addCommonOptions(command: Command) {
  return command
    .option("-h, --headless", "generate without any ui")
    .option("-sf, --has-src-folder", "has a src folder")
    .option(
      "-pm, --package-manager <pm>",
      "preferred package manager (npm, yarn, pnpm, bun)"
    )
    .option(
      "-cl, --component-lib <component-lib>",
      "preferred component library (shadcn-ui)"
    )
    .option("-o, --orm <orm>", "preferred orm (prisma, drizzle)")
    .option("-db, --db <db>", "preferred database (pg, mysql, sqlite)")
    .option("-dbp, --db-provider <db>", "database provider")
    .option("-a, --auth <auth>", "preferred auth (better-auth, clerk)")
    .option(
      "-ap, --auth-providers <auth-providers...>",
      "social auth providers (discord, google, github, apple)"
    )
    .option(
      "-mp, --misc-packages <packages...>",
      "misc packages (resend, stripe, trpc)"
    )
    .option("-ie, --include-example", "include example model in schema");
}

process.on("SIGINT", () => {
  // Then end process
  process.exit();
});
