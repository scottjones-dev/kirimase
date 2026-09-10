import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// This suite scaffolds a real Next.js project on disk, runs `gennext init`
// against it headlessly, installs the resulting dependencies for real, and
// typechecks the output with `tsc --noEmit`. Unlike the rest of the test
// suite (which only asserts against generator string output), this is the
// one place that would catch a generator producing syntactically-plausible
// but actually-broken TypeScript.
//
// `gennext generate` has no non-interactive CLI entry point (it always
// drives @inquirer/prompts), so it isn't exercised here via subprocess.

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
const cliPath = path.join(projectRoot, "dist", "index.js");
const fixturesDir = path.join(projectRoot, "test", "fixtures");

const SUBPROCESS_TIMEOUT_MS = 5 * 60 * 1000;

const scaffoldInto = (fixtureName) => {
  const tmpRoot = mkdtempSync(path.join(tmpdir(), "gennext-e2e-"));
  const projectDir = path.join(tmpRoot, "project");
  cpSync(path.join(fixturesDir, fixtureName), projectDir, { recursive: true });
  return projectDir;
};

const runGennext = (cwd, args) => {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    // stdin must be closed (not just unspecified/piped-and-idle): if any
    // step downstream unexpectedly reads from stdin, an open-but-silent
    // pipe blocks forever instead of failing fast.
    stdio: ["ignore", "pipe", "pipe"],
    timeout: SUBPROCESS_TIMEOUT_MS,
  });
  if (result.status !== 0) {
    throw new Error(
      `gennext ${args.join(" ")} failed (exit ${result.status}, signal ${result.signal}):\n${result.stdout}\n${result.stderr}`
    );
  }
  return result;
};

const run = (cwd, command, args) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: SUBPROCESS_TIMEOUT_MS,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (exit ${result.status}, signal ${result.signal}):\n${result.stdout}\n${result.stderr}`
    );
  }
  return result;
};

test("Drizzle + Postgres + Better Auth (email) + tRPC scaffolds and typechecks", () => {
  const projectDir = scaffoldInto("next-app-nonsrc");
  try {
    runGennext(projectDir, [
      "init",
      "--headless",
      "-pm",
      "pnpm",
      "-o",
      "drizzle",
      "-db",
      "pg",
      "-dbp",
      "postgresjs",
      "-cl",
      "shadcn-ui",
      "-mp",
      "trpc",
      "-a",
      "better-auth",
      // `-ap` with no values selects zero social providers. Combining
      // Better Auth with a social provider (or with Stripe) currently
      // crashes GenNext's own post-install schema generation, because
      // those packages register required-but-intentionally-empty env
      // vars that fail @t3-oss/env-nextjs validation the moment the
      // Better Auth CLI loads the app's env module. Tracked separately
      // (see spawned follow-up task) rather than fixed here.
      "-ap",
    ]);

    run(projectDir, "pnpm", ["install"]);
    run(projectDir, "pnpm", ["exec", "tsc", "--noEmit"]);
  } finally {
    rmSync(projectDir, { force: true, recursive: true });
  }
});

test("Prisma + SQLite + Clerk scaffolds and typechecks (src layout)", () => {
  const projectDir = scaffoldInto("next-app-src");
  try {
    runGennext(projectDir, [
      "init",
      "--headless",
      "-sf",
      "-pm",
      "pnpm",
      "-o",
      "prisma",
      "-db",
      "sqlite",
      "-a",
      "clerk",
      "-cl",
      "shadcn-ui",
      "-mp",
      "resend",
    ]);

    run(projectDir, "pnpm", ["install"]);
    // Prisma generates @prisma/client's types locally; nothing else in the
    // scaffold flow runs this, so it has to happen before typechecking.
    run(projectDir, "pnpm", ["exec", "prisma", "generate"]);
    run(projectDir, "pnpm", ["exec", "tsc", "--noEmit"]);
  } finally {
    rmSync(projectDir, { force: true, recursive: true });
  }
});
