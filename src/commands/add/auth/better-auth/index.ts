import { randomBytes } from "node:crypto";
import type { InitOptions } from "../../../../types.js";
import {
  addPackageToConfig,
  createFile,
  readConfigFile,
  updateConfigFile,
} from "../../../../utils.js";
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../filePaths/index.js";
import { updateRootSchema } from "../../../generate/generators/model/utils.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import { addPostInstallTask, addToInstallList } from "../../utils.js";
import type { AuthProvider } from "../shared/providers.js";
import { updateTrpcWithSessionIfInstalled } from "../shared/trpc.js";
import {
  generateBetterAuthAccountPage,
  generateBetterAuthClient,
  generateBetterAuthRoute,
  generateBetterAuthServer,
  generateBetterAuthUtils,
  generateEmptyDrizzleAuthSchema,
  generateSignInPage,
  generateSignOutButton,
  generateSignUpPage,
  generateUpdateProfile,
} from "./generators.js";
import { generateBetterAuthSchema } from "./schema.js";

const BETTER_AUTH_VERSION = "1.7.4";

export const addBetterAuth = (
  providers: AuthProvider[] = [],
  options?: InitOptions
) => {
  const config = readConfigFile();
  if (!(config.orm && config.driver)) {
    throw new Error(
      "Better Auth requires Drizzle or Prisma to be configured first."
    );
  }
  const { betterAuth, shared } = getFilePaths();
  const dbIndex = getDbIndexPath();
  if (!dbIndex) {
    throw new Error("Unable to find the configured database client.");
  }

  const authServerPath = formatFilePath(betterAuth.authServer, {
    prefix: "rootPath",
    removeExtension: false,
  });
  const authServerImport = formatFilePath(betterAuth.authServer, {
    prefix: "alias",
    removeExtension: true,
  });
  const authClientImport = formatFilePath(betterAuth.authClient, {
    prefix: "alias",
    removeExtension: true,
  });
  const authSchemaPath =
    config.orm === "drizzle"
      ? formatFilePath(shared.auth.authSchema, {
          prefix: "rootPath",
          removeExtension: false,
        })
      : "prisma/schema.prisma";

  if (config.orm === "drizzle") {
    createFile(authSchemaPath, generateEmptyDrizzleAuthSchema());
  }
  createFile(
    authServerPath,
    generateBetterAuthServer({
      authClientImport,
      authSchemaImport: formatFilePath(shared.auth.authSchema, {
        prefix: "alias",
        removeExtension: true,
      }),
      authServerImport,
      dbImport: formatFilePath(dbIndex, {
        prefix: "alias",
        removeExtension: true,
      }),
      driver: config.driver,
      orm: config.orm,
      providers,
    })
  );
  createFile(
    formatFilePath(betterAuth.authClient, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateBetterAuthClient()
  );
  createFile(
    formatFilePath(betterAuth.routeHandler, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateBetterAuthRoute(authServerImport)
  );
  createFile(
    formatFilePath(shared.auth.authUtils, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateBetterAuthUtils(authServerImport)
  );

  if (options?.headless === undefined) {
    createFile(
      formatFilePath(betterAuth.signInPage, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateSignInPage(authClientImport, providers)
    );
    createFile(
      formatFilePath(betterAuth.signUpPage, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateSignUpPage(authClientImport)
    );
    createFile(
      formatFilePath(betterAuth.signOutButton, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateSignOutButton(authClientImport)
    );
    createFile(
      formatFilePath(betterAuth.updateProfile, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateUpdateProfile(authClientImport)
    );
    createFile(
      formatFilePath(shared.auth.accountPage, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateBetterAuthAccountPage(
        formatFilePath(betterAuth.updateProfile, {
          prefix: "alias",
          removeExtension: true,
        }),
        formatFilePath(betterAuth.signOutButton, {
          prefix: "alias",
          removeExtension: true,
        })
      )
    );
  }

  const environmentVariables = [
    { isUrl: true, key: "BETTER_AUTH_URL", value: "http://localhost:3000" },
    {
      key: "BETTER_AUTH_SECRET",
      value: randomBytes(32).toString("base64url"),
    },
    ...providers.flatMap((provider) => [
      { key: `${provider.toUpperCase()}_CLIENT_ID`, value: "" },
      { key: `${provider.toUpperCase()}_CLIENT_SECRET`, value: "" },
    ]),
  ];
  addToDotEnv(environmentVariables);
  addToInstallList({
    dev: [`auth@${BETTER_AUTH_VERSION}`],
    regular: [`better-auth@${BETTER_AUTH_VERSION}`],
  });
  addPackageToConfig("better-auth");
  updateConfigFile({ auth: "better-auth" });
  updateTrpcWithSessionIfInstalled();
  addPostInstallTask(async () => {
    await generateBetterAuthSchema({
      authConfigPath: authServerPath,
      authSchemaPath,
      orm: config.orm,
      packageManager: config.preferredPackageManager,
    });
    if (config.t3 && config.orm === "drizzle") {
      updateRootSchema("auth", true, "better-auth");
    }
  });
};
