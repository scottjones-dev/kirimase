---
"gennext": patch
---

Fix a crash where a failed dependency install (e.g. pnpm blocking a package's build script) was silently swallowed and surfaced later as an unrelated, uncaught error. Install failures now propagate immediately with a clean error message, and `gennext` writes `pnpm-workspace.yaml` with `dangerouslyAllowAllBuilds: true` into scaffolded pnpm projects to prevent that specific pnpm gate from blocking installs in the first place.
