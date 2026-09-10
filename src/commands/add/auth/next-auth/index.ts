import type { InitOptions } from "../../../../types.js";
import {
  addPackageToConfig,
  createFile,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { updateRootSchema } from "../../../generate/generators/model/utils.js";
import { addToPrismaSchema } from "../../../generate/utils.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import {
  addContextProviderToAppLayout,
  // addContextProviderToAuthLayout,
  addToInstallList,
} from "../../utils.js";
import { updateTrpcWithSessionIfInstalled } from "../shared/index.js";
import {
  apiAuthNextAuthTs,
  createDrizzleAuthSchema,
  createPrismaAuthSchema,
  createSignInComponent,
  generateSignInPage,
  generateUpdatedRootRoute,
  libAuthProviderTsx,
  libAuthUtilsTs,
} from "./generators.js";
import { AuthDriver, type AuthProvider } from "./utils.js";

export const addNextAuth = (
  providers: AuthProvider[],
  options?: InitOptions
) => {
  const {
    hasSrc,
    driver,
    orm,
    componentLib,
    provider: dbProvider,
    t3,
  } = readConfigFile();
  const _rootPath = `${hasSrc ? "src/" : ""}`;
  const { "next-auth": nextAuth, shared } = getFilePaths();

  // 1. Create app/api/auth/[...nextauth].ts
  createFile(
    formatFilePath(nextAuth.nextAuthApiRoute, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    apiAuthNextAuthTs()
  );

  // 2. create lib/auth/Provider.tsx
  createFile(
    formatFilePath(nextAuth.authProviderComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    libAuthProviderTsx()
  );

  // 3. create lib/auth/utils.ts
  createFile(
    formatFilePath(shared.auth.authUtils, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    libAuthUtilsTs(providers, driver, orm)
  );

  // 4. create lib/db/schema/auth.ts
  if (orm !== null) {
    if (orm === "drizzle") {
      createFile(
        formatFilePath(shared.auth.authSchema, {
          prefix: "rootPath",
          removeExtension: false,
        }),
        createDrizzleAuthSchema(driver)
      );
      if (t3) {
        updateRootSchema("auth", true, "next-auth");
      }
    }
    if (orm === "prisma") {
      addToPrismaSchema(
        createPrismaAuthSchema(
          driver,
          dbProvider === "planetscale",
          providers.includes("github")
        ),
        "Auth"
      );
    }
  }

  // 5. create components/auth/SignIn.tsx - TODO - may be causing problems
  createFile(
    formatFilePath(shared.auth.signInComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createSignInComponent(componentLib)
  );

  // 6. If trpc installed, add protectedProcedure // this wont run because it is installed before trpc
  updateTrpcWithSessionIfInstalled();

  if (options.headless === undefined) {
    replaceFile(
      formatFilePath(shared.init.dashboardRoute, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateUpdatedRootRoute()
    );
  }

  // generate sign in page
  if (options.headless === undefined) {
    createFile(
      formatFilePath(nextAuth.signInPage, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateSignInPage()
    );
  }

  // add to env
  addToDotEnv(
    [
      {
        customZodImplementation: `process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional()`,
        key: "NEXTAUTH_SECRET",
        value: "your_super_secret_key_here",
      },
      {
        customZodImplementation: `z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include \`https\` so it cant be validated as a URL
      process.env.VERCEL_URL ? z.string().min(1) : z.string().url()
    )`,
        key: "NEXTAUTH_URL",
        value: "http://localhost:3000",
      },
      ...providers.flatMap((p) => [
        {
          key: p.toUpperCase().concat("_CLIENT_ID"),
          value: `your_${p}_id_here`,
          // value: "",
        },
        {
          key: p.toUpperCase().concat("_CLIENT_SECRET"),
          value: `your_${p}_secret_here`,
          // value: "",
        },
      ]),
    ],
    hasSrc ? "src/" : ""
  );

  // 7. Install Packages: @auth/core @auth/drizzle-adapter next-auth
  // await installPackages(
  //   {
  //     regular: `@auth/core next-auth${
  //       orm !== null ? ` ${AuthDriver[orm].package}` : ""
  //     }`,
  //     dev: "",
  //   },
  //   preferredPackageManager
  // );

  addToInstallList({ dev: [], regular: ["@auth/core", "next-auth"] });
  if (orm !== null) {
    addToInstallList({ dev: [], regular: [AuthDriver[orm].package] });
  }

  addPackageToConfig("next-auth");
  updateConfigFile({ auth: "next-auth" });
  // TODO: 9. Instruct user to add the <Provider /> to their root layout.
  // addContextProviderToAuthLayout("NextAuthProvider");
  if (options.headless === undefined) {
    addContextProviderToAppLayout("NextAuthProvider");
  }
  // if (orm === "prisma") await prismaGenerate(preferredPackageManager);
  // consola.success("Successfully added Next Auth to your project!");
};
