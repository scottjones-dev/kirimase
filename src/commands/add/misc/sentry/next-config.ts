import fs from "node:fs";
import path from "node:path";
import { consola } from "consola";
import { replaceFile } from "../../../../utils.js";

const CONFIG_FILE_CANDIDATES = [
  "next.config.ts",
  "next.config.mjs",
  "next.config.js",
];

const SENTRY_IMPORT_STATEMENT =
  'import { withSentryConfig } from "@sentry/nextjs";';

const ESM_DEFAULT_EXPORT_PATTERN =
  /export default\s+([A-Za-z_$][\w$]*)\s*;?\s*$/m;
const CJS_MODULE_EXPORTS_PATTERN =
  /module\.exports\s*=\s*([A-Za-z_$][\w$]*)\s*;?\s*$/m;

const MANUAL_PATCH_NOTE =
  "Wrap next.config with Sentry manually — see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/";

const findNextConfigPath = (): string | null => {
  for (const candidate of CONFIG_FILE_CANDIDATES) {
    if (fs.existsSync(path.resolve(candidate))) {
      return candidate;
    }
  }
  return null;
};

const insertImportAfterLastImport = (
  fileContent: string,
  importStatement: string
) => {
  if (fileContent.includes(importStatement)) {
    return fileContent;
  }
  const lastIndexOfImport = fileContent.lastIndexOf("import");
  if (lastIndexOfImport === -1) {
    return `${importStatement}\n${fileContent}`;
  }
  const nextLineAfterLastImport =
    fileContent.indexOf("\n", lastIndexOfImport) + 1;
  const beforeImport = fileContent.slice(0, nextLineAfterLastImport);
  const afterImport = fileContent.slice(nextLineAfterLastImport);
  return `${beforeImport}${importStatement}\n${afterImport}`;
};

const wrapExportForSentry = (identifier: string) =>
  `withSentryConfig(${identifier}, {\n  org: process.env.SENTRY_ORG,\n  project: process.env.SENTRY_PROJECT,\n  silent: true,\n})`;

export const wrapNextConfigWithSentry = (): {
  configPath: string | null;
  patched: boolean;
} => {
  const configPath = findNextConfigPath();
  if (!configPath) {
    consola.warn(
      `Could not find a next.config.{ts,mjs,js} file to wrap with Sentry. ${MANUAL_PATCH_NOTE}`
    );
    return { configPath: null, patched: false };
  }

  const resolvedPath = path.resolve(configPath);
  const fileContent = fs.readFileSync(resolvedPath, "utf-8");

  const esmMatch = fileContent.match(ESM_DEFAULT_EXPORT_PATTERN);
  const cjsMatch = esmMatch
    ? null
    : fileContent.match(CJS_MODULE_EXPORTS_PATTERN);

  if (!(esmMatch || cjsMatch)) {
    consola.warn(
      `Could not confidently patch ${configPath} to wrap it with Sentry (unrecognized export shape). ${MANUAL_PATCH_NOTE}`
    );
    return { configPath, patched: false };
  }

  const match = esmMatch ?? cjsMatch;
  const [, identifier] = match;
  const withImport = insertImportAfterLastImport(
    fileContent,
    SENTRY_IMPORT_STATEMENT
  );

  const exportPattern = esmMatch
    ? ESM_DEFAULT_EXPORT_PATTERN
    : CJS_MODULE_EXPORTS_PATTERN;
  const wrappedExport = esmMatch
    ? `export default ${wrapExportForSentry(identifier)};`
    : `module.exports = ${wrapExportForSentry(identifier)};`;

  const newContent = withImport.replace(exportPattern, wrappedExport);
  replaceFile(configPath, newContent);

  return { configPath, patched: true };
};
