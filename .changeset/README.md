# Changesets

This directory holds changesets — small markdown files describing an unreleased
change and how it should bump the version (`patch`, `minor`, or `major`).

To add one for your change:

```sh
pnpm changeset
```

This asks which bump type applies and for a short summary, then writes a file
here. Commit it alongside your change. On merge to `master`, CI opens (or
updates) a "Version Packages" pull request that rolls up all pending
changesets into a version bump and `CHANGELOG.md` entry; merging that PR
publishes the new version to npm.

See https://github.com/changesets/changesets for full documentation.
