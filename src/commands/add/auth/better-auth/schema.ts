import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import type { ORMType, PMType } from "../../../../types.js";
import { runCommand } from "../../../../utils.js";

const PRISMA_BLOCK_PATTERN = /(?:enum|model|type)\s+(\w+)\s*\{[^}]*\}/g;

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

const extractPrismaBlocks = (schema: string) => {
  const blocks = new Map<string, string>();
  for (const match of schema.matchAll(PRISMA_BLOCK_PATTERN)) {
    blocks.set(match[1], match[0].trim());
  }
  return blocks;
};

export const mergeBetterAuthPrismaSchema = (
  existingSchema: string,
  generatedSchema: string
) => {
  const generatedBlocks = extractPrismaBlocks(generatedSchema);
  if (generatedBlocks.size === 0) {
    throw new Error("The Better Auth CLI did not produce Prisma models.");
  }

  const existingBlocks = extractPrismaBlocks(existingSchema);
  const newBlocks = [...generatedBlocks.entries()]
    .filter(([name]) => !existingBlocks.has(name))
    .map(([, block]) => block);

  if (newBlocks.length === 0) {
    return existingSchema;
  }
  return `${existingSchema.trimEnd()}\n\n${newBlocks.join("\n\n")}\n`;
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

  const temporaryDirectory = ".gennext";
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
