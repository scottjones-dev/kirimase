import type { ORMType } from "../../types.js";
import { readConfigFile } from "../../utils.js";
import type { Paths } from "./types.js";

export const paths: { t3: Paths; normal: Paths } = {
  normal: {
    clerk: {
      middleware: "middleware.ts",
      signInPage: "app/(auth)/sign-in/[[...sign-in]]/page.tsx",
      signUpPage: "app/(auth)/sign-up/[[...sign-in]]/page.tsx",
    },
    drizzle: {
      dbIndex: "lib/db/index.ts",
      dbMigrate: "lib/db/migrate.ts",
      migrationsDir: "lib/db/migrations",
    },
    prisma: { dbIndex: "lib/db/index.ts" },
    resend: {
      emailApiRoute: "app/api/email/route.ts",
      emailUtils: "lib/email/utils.ts",
      firstEmailComponent: "components/emails/FirstEmail.tsx",
      libEmailIndex: "lib/email/index.ts",
      resendPage: "app/(app)/resend/page.tsx",
    },
    shared: {
      auth: {
        accountApiRoute: "app/api/account/route.ts",
        accountCardComponent: "app/(app)/account/AccountCard.tsx",
        accountPage: "app/(app)/account/page.tsx",
        authSchema: "lib/db/schema/auth.ts",
        authUtils: "lib/auth/utils.ts",
        layoutPage: "app/(auth)/layout.tsx",
        signInComponent: "components/auth/SignIn.tsx",
        updateEmailCardComponent: "app/(app)/account/UpdateEmailCard.tsx",
        updateNameCardComponent: "app/(app)/account/UpdateNameCard.tsx",
        userSettingsComponent: "app/(app)/account/UserSettings.tsx",
      },
      init: {
        appLayout: "app/(app)/layout.tsx",
        dashboardRoute: "app/(app)/dashboard/page.tsx",
        envMjs: "lib/env.mjs",
        globalCss: "app/globals.css",
        indexRoute: "app/page.tsx",
        libUtils: "lib/utils.ts",
        navbarComponent: "components/Navbar.tsx",
        sidebarComponent: "components/Sidebar.tsx",
      },
      orm: {
        schemaDir: "lib/db/schema",
        servicesDir: "lib/api",
      },
    },
    stripe: {
      accountBillingPage: "app/(app)/account/billing/page.tsx",
      accountPlanSettingsComponent: "app/(app)/account/PlanSettings.tsx",
      accountRouterTrpc: "lib/server/routers/account.ts",
      billingManageSubscriptionComponent:
        "app/(app)/account/billing/ManageSubscription.tsx",
      billingSuccessToast: "app/(app)/account/billing/SuccessToast.tsx",
      configSubscription: "config/subscriptions.ts",
      manageSubscriptionApiRoute:
        "app/api/billing/manage-subscription/route.ts",
      stripeIndex: "lib/stripe/index.ts",
      stripeSubscription: "lib/stripe/subscription.ts",
      stripeWebhooksApiRoute: "app/api/webhooks/stripe/route.ts",
      subscriptionSchema: "lib/db/schema/subscriptions.ts",
    },
    trpc: {
      rootRouter: "lib/server/routers/_app.ts",
      routerDir: "lib/server/routers",
      serverTrpc: "lib/server/trpc.ts",
      trpcApiRoute: "app/api/trpc/[trpc]/route.ts",
      trpcApiTs: "lib/trpc/api.ts",
      trpcClient: "lib/trpc/client.ts",
      trpcContext: "lib/trpc/context.ts",
      trpcProvider: "lib/trpc/Provider.tsx",
      trpcUtils: "lib/trpc/utils.ts",
    },
  },
  t3: {
    clerk: {
      middleware: "middleware.ts",
      signInPage: "app/(auth)/sign-in/[[...sign-in]]/page.tsx",
      signUpPage: "app/(auth)/sign-up/[[...sign-in]]/page.tsx",
    },
    drizzle: {
      dbIndex: "server/db/index.ts",
      dbMigrate: "server/db/migrate.ts",
      migrationsDir: "server/db/migrations",
      schemaAggregator: "server/db/schema/_root.ts",
      schemaTs: "server/db/schema.ts",
    },
    prisma: { dbIndex: "server/db.ts" },
    resend: {
      emailApiRoute: "app/api/email/route.ts",
      emailUtils: "lib/email/utils.ts",
      firstEmailComponent: "components/emails/FirstEmail.tsx",
      libEmailIndex: "lib/email/index.ts",
      resendPage: "app/(app)/resend/page.tsx",
    },
    shared: {
      auth: {
        accountApiRoute: "app/api/account/route.ts",
        accountCardComponent: "app/(app)/account/AccountCard.tsx",
        accountPage: "app/(app)/account/page.tsx",
        authSchema: "server/db/schema/auth.ts",
        authUtils: "lib/auth/utils.ts",
        layoutPage: "app/(auth)/layout.tsx",
        signInComponent: "components/auth/SignIn.tsx",
        updateEmailCardComponent: "app/(app)/account/UpdateEmailCard.tsx",
        updateNameCardComponent: "app/(app)/account/UpdateNameCard.tsx",
        userSettingsComponent: "app/(app)/account/UserSettings.tsx",
      },
      init: {
        appLayout: "app/(app)/layout.tsx",
        dashboardRoute: "app/(app)/dashboard/page.tsx",
        envMjs: "env.js",
        globalCss: "styles/globals.css",
        indexRoute: "app/page.tsx",
        libUtils: "lib/utils.ts",
        navbarComponent: "components/Navbar.tsx",
        sidebarComponent: "components/Sidebar.tsx",
      },
      orm: {
        schemaDir: "server/db/schema",
        servicesDir: "lib/api",
      },
    },
    stripe: {
      accountBillingPage: "app/(app)/account/billing/page.tsx",
      accountPlanSettingsComponent: "app/(app)/account/PlanSettings.tsx",
      accountRouterTrpc: "server/api/routers/account.ts",
      billingManageSubscriptionComponent:
        "app/(app)/account/billing/ManageSubscription.tsx",
      billingSuccessToast: "app/(app)/account/billing/SuccessToast.tsx",
      configSubscription: "config/subscriptions.ts",
      manageSubscriptionApiRoute:
        "app/api/billing/manage-subscription/route.ts",
      stripeIndex: "lib/stripe/index.ts",
      stripeSubscription: "lib/stripe/subscription.ts",
      stripeWebhooksApiRoute: "app/api/webhooks/stripe/route.ts",
      subscriptionSchema: "server/db/schema/subscriptions.ts",
    },
    trpc: {
      rootRouter: "server/api/root.ts",
      routerDir: "server/api/routers",
      serverTrpc: "server/api/trpc.ts",
      trpcApiRoute: "app/api/trpc/[trpc]/route.ts",
      trpcApiTs: "trpc/server.ts",
      trpcClient: "trpc/react.tsx",
      trpcContext: "server/api/trpc.ts",
      trpcProvider: "trpc/react.tsx",
      trpcUtils: "trpc/shared.ts",
    },
  },
};
export const getFilePaths = () => {
  const { t3 } = readConfigFile();
  if (t3) {
    return paths.t3;
  }
  return paths.normal;
};

export function removeFileExtension(filePath: string): string {
  // Check if the filePath has an extension by looking for the last dot
  const lastDotIndex = filePath.lastIndexOf(".");

  // Ensure that the dot is not the first character (hidden files) and is not part of the directory path
  if (lastDotIndex > 0 && filePath.lastIndexOf("/") < lastDotIndex) {
    // Remove the extension
    return filePath.slice(0, lastDotIndex);
  }

  // Return the original filePath if no extension was found
  return filePath;
}

export const formatFilePath = (
  filePath: string,
  opts: {
    prefix: "alias" | "rootPath";
    removeExtension: boolean;
  }
) => {
  const { alias, rootPath } = readConfigFile();
  const formattedFP = opts.removeExtension
    ? removeFileExtension(filePath)
    : filePath;
  return `${opts.prefix === "alias" ? `${alias}/` : rootPath}${formattedFP}`;
};

export const generateServiceFileNames = (newModel: string) => {
  const { shared } = getFilePaths();
  const { rootPath } = readConfigFile();
  const rootDir = rootPath.concat(shared.orm.servicesDir);
  return {
    mutationsPath: `${rootDir}/${newModel}/mutations.ts`,
    queriesPath: `${rootDir}/${newModel}/queries.ts`,
  };
};

export const getDbIndexPath = (ormToBeInstalled?: ORMType) => {
  const { drizzle, prisma } = getFilePaths();
  const { orm: ormFromConfig } = readConfigFile();
  const orm = ormToBeInstalled ? ormToBeInstalled : ormFromConfig;
  if (orm === "prisma") {
    return prisma.dbIndex;
  }
  if (orm === "drizzle") {
    return drizzle.dbIndex;
  }
  if (!orm || orm === "null") {
    return null;
  }
};
