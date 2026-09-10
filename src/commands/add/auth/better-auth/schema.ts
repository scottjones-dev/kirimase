import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import type { ORMType, PMType } from "../../../../types.js";
import { runCommand } from "../../../../utils.js";

const PRISMA_DECLARATION_PATTERN = /(?:enum|model|type)\s+[A-Za-z_][\s\S]*/;

export interface BetterAuthSchemaOptions {
  authConfigPath: string;
  authSchemaPath: string;
  orm: ORMType;
  packageManager: PMType;
}

export const getBetterAuthSchemaCommand = (
  packageManager: PMType,
  authConfigPath: string,
  outputPath: string
) => {
  const authArguments = [
    "auth",
    "generate",
    "--config",
    authConfigPath,
    "--output",
    outputPath,
    "--yes",
  ];
  switch (packageManager) {
    case "npm":
      return { args: ["exec", "--", ...authArguments], command: "npm" };
    case "pnpm":
      return { args: ["exec", ...authArguments], command: "pnpm" };
    case "yarn":
      return { args: authArguments, command: "yarn" };
    case "bun":
      return { args: ["x", ...authArguments], command: "bun" };
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};

export const mergeBetterAuthPrismaSchema = (
  existingSchema: string,
  generatedSchema: string
) => {
  if (
    existingSchema.includes("model User {") ||
    existingSchema.includes("model Account {")
  ) {
    throw new Error(
      "Prisma already contains authentication models. Merge the Better Auth schema manually before retrying."
    );
  }
  const declarations = generatedSchema.match(PRISMA_DECLARATION_PATTERN)?.[0];
  if (!declarations) {
    throw new Error("The Better Auth CLI did not produce Prisma models.");
  }
  return `${existingSchema.trimEnd()}\n\n${declarations.trim()}\n`;
};

export const generateBetterAuthSchema = async (
  options: BetterAuthSchemaOptions
) => {
  if (options.orm === "drizzle") {
    const invocation = getBetterAuthSchemaCommand(
      options.packageManager,
      options.authConfigPath,
      options.authSchemaPath
    );
    await runCommand(invocation.command, invocation.args);
    return;
  }

  const temporaryDirectory = ".kirimase";
  const temporarySchema = `${temporaryDirectory}/better-auth.prisma`;
  mkdirSync(temporaryDirectory, { recursive: true });
  const invocation = getBetterAuthSchemaCommand(
    options.packageManager,
    options.authConfigPath,
    temporarySchema
  );
  await runCommand(invocation.command, invocation.args);
  if (!existsSync(temporarySchema)) {
    throw new Error("The Better Auth CLI did not create a Prisma schema.");
  }
  const existingSchema = readFileSync(options.authSchemaPath, "utf-8");
  const generatedSchema = readFileSync(temporarySchema, "utf-8");
  writeFileSync(
    options.authSchemaPath,
    mergeBetterAuthPrismaSchema(existingSchema, generatedSchema)
  );
  unlinkSync(temporarySchema);
};
