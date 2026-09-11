import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { sentryGenerators } from "../dist/commands/add/misc/sentry/generators.js";

const SENTRY_IMPORT_PATTERN = /from "@sentry\/nextjs"/;
const SENTRY_INIT_PATTERN = /Sentry\.init\(/;
const REGISTER_EXPORT_PATTERN = /export function register/;
const ON_REQUEST_ERROR_PATTERN = /export const onRequestError/;
const NODEJS_RUNTIME_PATTERN = /NEXT_RUNTIME === "nodejs"/;
const EDGE_RUNTIME_PATTERN = /NEXT_RUNTIME === "edge"/;
const SENTRY_CONFIG_IMPORT_PATTERN =
  /import \{ withSentryConfig \} from "@sentry\/nextjs";/;
const ESM_WRAPPED_EXPORT_PATTERN =
  /export default withSentryConfig\(nextConfig, \{/;
const CJS_WRAPPED_EXPORT_PATTERN =
  /module\.exports = withSentryConfig\(nextConfig, \{/;

test("instrumentation.ts initializes Sentry for both the nodejs and edge runtimes", () => {
  const output = sentryGenerators.generateInstrumentationTs();
  assert.match(output, SENTRY_IMPORT_PATTERN);
  assert.match(output, REGISTER_EXPORT_PATTERN);
  assert.match(output, ON_REQUEST_ERROR_PATTERN);
  assert.match(output, NODEJS_RUNTIME_PATTERN);
  assert.match(output, EDGE_RUNTIME_PATTERN);
});

test("instrumentation-client.ts initializes the browser Sentry SDK", () => {
  const output = sentryGenerators.generateInstrumentationClientTs();
  assert.match(output, SENTRY_IMPORT_PATTERN);
  assert.match(output, SENTRY_INIT_PATTERN);
});

test("wrapNextConfigWithSentry patches an ESM identifier default export", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "gennext-sentry-"));
  const cwd = process.cwd();
  try {
    writeFileSync(
      path.join(dir, "next.config.mjs"),
      "/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nexport default nextConfig;\n"
    );
    process.chdir(dir);
    const { wrapNextConfigWithSentry } = await import(
      "../dist/commands/add/misc/sentry/next-config.js"
    );
    const result = wrapNextConfigWithSentry();
    assert.equal(result.patched, true);
    const { readFileSync } = await import("node:fs");
    const content = readFileSync(path.join(dir, "next.config.mjs"), "utf-8");
    assert.match(content, SENTRY_CONFIG_IMPORT_PATTERN);
    assert.match(content, ESM_WRAPPED_EXPORT_PATTERN);
  } finally {
    process.chdir(cwd);
    rmSync(dir, { force: true, recursive: true });
  }
});

test("wrapNextConfigWithSentry patches a CJS module.exports identifier", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "gennext-sentry-"));
  const cwd = process.cwd();
  try {
    writeFileSync(
      path.join(dir, "next.config.js"),
      "/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nmodule.exports = nextConfig;\n"
    );
    process.chdir(dir);
    const { wrapNextConfigWithSentry } = await import(
      "../dist/commands/add/misc/sentry/next-config.js"
    );
    const result = wrapNextConfigWithSentry();
    assert.equal(result.patched, true);
    const { readFileSync } = await import("node:fs");
    const content = readFileSync(path.join(dir, "next.config.js"), "utf-8");
    assert.match(content, SENTRY_CONFIG_IMPORT_PATTERN);
    assert.match(content, CJS_WRAPPED_EXPORT_PATTERN);
  } finally {
    process.chdir(cwd);
    rmSync(dir, { force: true, recursive: true });
  }
});

test("wrapNextConfigWithSentry declines to patch an inline object default export", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "gennext-sentry-"));
  const cwd = process.cwd();
  try {
    writeFileSync(
      path.join(dir, "next.config.mjs"),
      "export default {\n  reactStrictMode: true,\n};\n"
    );
    process.chdir(dir);
    const { wrapNextConfigWithSentry } = await import(
      "../dist/commands/add/misc/sentry/next-config.js"
    );
    const result = wrapNextConfigWithSentry();
    assert.equal(result.patched, false);
    const { readFileSync } = await import("node:fs");
    const content = readFileSync(path.join(dir, "next.config.mjs"), "utf-8");
    assert.doesNotMatch(content, SENTRY_IMPORT_PATTERN);
  } finally {
    process.chdir(cwd);
    rmSync(dir, { force: true, recursive: true });
  }
});

test("wrapNextConfigWithSentry reports no config file found", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "gennext-sentry-"));
  const cwd = process.cwd();
  try {
    process.chdir(dir);
    const { wrapNextConfigWithSentry } = await import(
      "../dist/commands/add/misc/sentry/next-config.js"
    );
    const result = wrapNextConfigWithSentry();
    assert.equal(result.patched, false);
    assert.equal(result.configPath, null);
  } finally {
    process.chdir(cwd);
    rmSync(dir, { force: true, recursive: true });
  }
});
