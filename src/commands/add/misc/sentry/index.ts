import type { AvailablePackage, InitOptions } from "../../../../types.js";
import {
  addPackageToConfig,
  createFile,
  readConfigFile,
} from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import { addManualStep, addToInstallList } from "../../utils.js";
import { sentryGenerators } from "./generators.js";
import { wrapNextConfigWithSentry } from "./next-config.js";

export const addSentry = (
  _packagesBeingInstalled: AvailablePackage[],
  _options?: InitOptions
) => {
  const { rootPath } = readConfigFile();
  const { sentry } = getFilePaths();
  const { generateInstrumentationTs, generateInstrumentationClientTs } =
    sentryGenerators;

  // 1. Add instrumentation.ts (server + edge init)
  createFile(
    formatFilePath(sentry.instrumentationTs, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateInstrumentationTs()
  );

  // 2. Add instrumentation-client.ts (browser init)
  createFile(
    formatFilePath(sentry.instrumentationClientTs, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateInstrumentationClientTs()
  );

  // 3. Wrap next.config.{ts,mjs,js} with withSentryConfig, warning + noting a
  // manual step in next-steps output if the file's export shape can't be
  // confidently patched.
  const { patched, configPath } = wrapNextConfigWithSentry();
  if (!patched) {
    addManualStep(
      configPath
        ? `Wrap the default export in ${configPath} with \`withSentryConfig\` from "@sentry/nextjs" — see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/`
        : 'Create a next.config file and wrap its default export with `withSentryConfig` from "@sentry/nextjs" — see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/'
    );
  }

  // 4. Add items to .env. These are all optional (rather than required, as
  // most other integrations' secrets are) because Sentry should never block
  // local dev or another package's post-install step (e.g. Better Auth's
  // schema generation, which eagerly loads env.mjs) just because it hasn't
  // been configured yet.
  addToDotEnv(
    [
      {
        customZodImplementation: "z.string().optional()",
        key: "NEXT_PUBLIC_SENTRY_DSN",
        public: true,
        value: "",
      },
      {
        customZodImplementation: "z.string().optional()",
        key: "SENTRY_AUTH_TOKEN",
        value: "",
      },
      {
        customZodImplementation: "z.string().optional()",
        key: "SENTRY_ORG",
        value: "",
      },
      {
        customZodImplementation: "z.string().optional()",
        key: "SENTRY_PROJECT",
        value: "",
      },
    ],
    rootPath,
    true
  );

  // 5. Install packages
  addToInstallList({ dev: [], regular: ["@sentry/nextjs"] });

  addPackageToConfig("sentry");
};
