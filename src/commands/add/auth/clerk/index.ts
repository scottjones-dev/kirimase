// 1. Mount <ClerkProvider />
// 2. Add Env keys in env.mjs too
// 3. Add middleware
// 4. Scaffold Signup and Signin pages
// 5. Add UserButton to Page.tsx
// 6. Add lib/auth/utils.ts
// 7. install package - @clerk/nextjs

import type { InitOptions } from "../../../../types.js";
import {
  addPackageToConfig,
  createFile,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import {
  addContextProviderToAppLayout,
  addContextProviderToAuthLayout,
  addToInstallList,
} from "../../utils.js";
import { updateTrpcWithSessionIfInstalled } from "../shared/trpc.js";
import { clerkGenerators } from "./generators.js";

export const addClerk = (options: InitOptions) => {
  const { rootPath, componentLib } = readConfigFile();
  const {
    clerk: { middleware, signInPage, signUpPage },
    shared: {
      auth: { authUtils },
      init,
    },
  } = getFilePaths();
  const {
    generateAuthUtilsTs,
    generateMiddlewareTs,
    generateSignInPageTs,
    generateSignUpPageTs,
    homePageWithUserButton,
  } = clerkGenerators;
  if (options.headless === undefined) {
    addContextProviderToAuthLayout("ClerkProvider");
    addContextProviderToAppLayout("ClerkProvider");
  }
  addToDotEnv(
    [
      { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", public: true, value: "" },
      { key: "CLERK_SECRET_KEY", value: "" },
      { key: "NEXT_PUBLIC_CLERK_SIGN_IN_URL", public: true, value: "/sign-in" },
      { key: "NEXT_PUBLIC_CLERK_SIGN_UP_URL", public: true, value: "/sign-up" },
      { key: "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL", public: true, value: "/" },
      { key: "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL", public: true, value: "/" },
    ],
    rootPath
  );
  createFile(
    formatFilePath(middleware, { prefix: "rootPath", removeExtension: false }),
    generateMiddlewareTs()
  );

  if (options.headless === undefined) {
    createFile(
      formatFilePath(signInPage, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateSignInPageTs()
    );
    createFile(
      formatFilePath(signUpPage, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateSignUpPageTs()
    );

    replaceFile(
      formatFilePath(init.dashboardRoute, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      homePageWithUserButton(componentLib)
    );
  }

  createFile(
    formatFilePath(authUtils, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateAuthUtilsTs()
  );

  // If trpc installed, add protectedProcedure
  updateTrpcWithSessionIfInstalled();

  addToInstallList({ dev: [], regular: ["@clerk/nextjs"] });
  // await installPackages(
  //   { regular: "@clerk/nextjs", dev: "" },
  //   preferredPackageManager,
  // );
  addPackageToConfig("clerk");
  updateConfigFile({ auth: "clerk" });
  // consola.success("Successfully added Clerk to your project!");
  // consola.info(
  //   "Head over to https://dashboard.clerk.com/apps/new to create a new Clerk app"
  // );
  //
};
