import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const cliPath = path.join(projectRoot, "dist", "index.js");
const cliDescriptionPattern = /Kirimase CLI/;
const generateCommandPattern = /generate/;
const initCommandPattern = /init/;
const unknownCommandPattern = /unknown command/;
const versionPattern = /^0\.0\.60\s*$/;

const runCli = (...args) =>
  spawnSync(process.execPath, [cliPath, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
  });

test("prints help", () => {
  const result = runCli("--help");

  assert.equal(result.status, 0);
  assert.match(result.stdout, cliDescriptionPattern);
  assert.match(result.stdout, initCommandPattern);
  assert.match(result.stdout, generateCommandPattern);
});

test("prints the package version", () => {
  const result = runCli("--version");

  assert.equal(result.status, 0);
  assert.match(result.stdout, versionPattern);
});

test("rejects unknown commands", () => {
  const result = runCli("not-a-command");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, unknownCommandPattern);
});
