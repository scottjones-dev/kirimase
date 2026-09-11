import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { ensurePnpmBuildsAllowed } from "../dist/utils.js";

const DANGEROUSLY_ALLOW_ALL_BUILDS_PATTERN = /dangerouslyAllowAllBuilds: true/;
const MINIMUM_RELEASE_AGE_EXCLUDE_PATTERN = /minimumReleaseAgeExclude/;
const DANGEROUSLY_ALLOW_ALL_BUILDS_GLOBAL_PATTERN =
  /dangerouslyAllowAllBuilds/g;

const withTmpCwd = (fn) => {
  const dir = mkdtempSync(path.join(tmpdir(), "gennext-pnpm-workspace-"));
  const originalCwd = process.cwd();
  process.chdir(dir);
  try {
    fn(dir);
  } finally {
    process.chdir(originalCwd);
    rmSync(dir, { force: true, recursive: true });
  }
};

test("ensurePnpmBuildsAllowed does nothing for non-pnpm package managers", () => {
  withTmpCwd((dir) => {
    ensurePnpmBuildsAllowed("npm");
    assert.equal(existsSync(path.join(dir, "pnpm-workspace.yaml")), false);
  });
});

test("ensurePnpmBuildsAllowed creates pnpm-workspace.yaml when none exists", () => {
  withTmpCwd((dir) => {
    ensurePnpmBuildsAllowed("pnpm");
    const contents = readFileSync(
      path.join(dir, "pnpm-workspace.yaml"),
      "utf-8"
    );
    assert.match(contents, DANGEROUSLY_ALLOW_ALL_BUILDS_PATTERN);
  });
});

test("ensurePnpmBuildsAllowed appends to an existing pnpm-workspace.yaml", () => {
  withTmpCwd((dir) => {
    writeFileSync(
      path.join(dir, "pnpm-workspace.yaml"),
      "minimumReleaseAgeExclude:\n  - some-package@1.0.0\n"
    );
    ensurePnpmBuildsAllowed("pnpm");
    const contents = readFileSync(
      path.join(dir, "pnpm-workspace.yaml"),
      "utf-8"
    );
    assert.match(contents, MINIMUM_RELEASE_AGE_EXCLUDE_PATTERN);
    assert.match(contents, DANGEROUSLY_ALLOW_ALL_BUILDS_PATTERN);
  });
});

test("ensurePnpmBuildsAllowed does not duplicate an already-present key", () => {
  withTmpCwd((dir) => {
    writeFileSync(
      path.join(dir, "pnpm-workspace.yaml"),
      "dangerouslyAllowAllBuilds: true\n"
    );
    ensurePnpmBuildsAllowed("pnpm");
    const contents = readFileSync(
      path.join(dir, "pnpm-workspace.yaml"),
      "utf-8"
    );
    const matches =
      contents.match(DANGEROUSLY_ALLOW_ALL_BUILDS_GLOBAL_PATTERN) ?? [];
    assert.equal(matches.length, 1);
  });
});
