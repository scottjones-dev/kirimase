export interface Paths {
  betterAuth: {
    authClient: string;
    authServer: string;
    routeHandler: string;
    signInPage: string;
    signOutButton: string;
    signUpPage: string;
    updateProfile: string;
  };
  clerk: {
    middleware: string;
    signInPage: string;
    signUpPage: string;
  };
  drizzle: {
    dbMigrate: string;
    migrationsDir: string;
    dbIndex: string;
    schemaTs?: string;
    schemaAggregator?: string;
  };
  posthog: {
    providerComponent: string;
    serverClient: string;
  };
  prisma: { dbIndex: string };
  resend: {
    resendPage: string;
    firstEmailComponent: string;
    emailLayoutComponent: string;
    emailApiRoute: string;
    emailUtils: string;
    libEmailIndex: string;
  };
  sentry: {
    instrumentationTs: string;
    instrumentationClientTs: string;
  };
  shared: {
    init: {
      envMjs: string;
      libUtils: string;
      globalCss: string;
      navbarComponent: string;
      sidebarComponent: string;
      appLayout: string;
      indexRoute: string;
      dashboardRoute: string;
    };
    orm: {
      servicesDir: string;
      schemaDir?: string;
    };
    auth: {
      authUtils: string;
      signInComponent: string;
      accountApiRoute: string;
      accountPage: string;
      userSettingsComponent: string;
      updateNameCardComponent: string;
      updateEmailCardComponent: string;
      accountCardComponent: string;
      layoutPage: string;
      authSchema?: string;
    };
  };
  storage: {
    storageClient: string;
    storageIndex: string;
    uploadUrlApiRoute: string;
    storagePage: string;
  };
  stripe: {
    subscriptionSchema?: string;
    stripeIndex: string;
    stripeSubscription: string;
    configSubscription: string;
    accountPlanSettingsComponent: string;
    billingManageSubscriptionComponent: string;
    billingSuccessToast: string;
    accountBillingPage: string;
    stripeWebhooksApiRoute: string;
    manageSubscriptionApiRoute: string;
    accountRouterTrpc?: string;
  };
  trpc: {
    rootRouter: string;
    routerDir: string;
    serverTrpc: string;
    trpcApiRoute: string;
    trpcClient: string;
    trpcProvider: string;
    trpcApiTs: string;
    trpcContext: string;
    trpcUtils: string;
  };
}
