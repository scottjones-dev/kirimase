import fs from "node:fs";
import chalk from "chalk";
import { consola } from "consola";
import type {
  AvailablePackage,
  InitOptions,
  PackageType,
} from "../../types.js";
import {
  ensurePnpmBuildsAllowed,
  installPackages,
  installShadcnUIComponents,
  readConfigFile,
  replaceFile,
} from "../../utils.js";
import { formatFilePath, getFilePaths } from "../filePaths/index.js";
import { AuthProviders } from "./auth/shared/providers.js";
import { spinner } from "./index.js";

export const Packages: {
  [key in PackageType]: {
    name: string;
    value: AvailablePackage;
    disabled?: boolean;
  }[];
} = {
  auth: [
    { name: "Better Auth", value: "better-auth" },
    { name: "Clerk", value: "clerk" },
  ],
  componentLib: [{ name: "Shadcn UI (with next-themes)", value: "shadcn-ui" }],
  misc: [
    { name: "TRPC", value: "trpc" },
    { name: "Stripe", value: "stripe" },
    { name: "Resend", value: "resend" },
    { name: "Sentry", value: "sentry" },
  ],
  orm: [
    { name: "Drizzle", value: "drizzle" },
    { name: "Prisma", value: "prisma" },
  ],
};

export const addContextProviderToRootLayout = (provider: "ThemeProvider") => {
  const { hasSrc, alias } = readConfigFile();
  const path = `${hasSrc ? "src/" : ""}app/layout.tsx`;

  const fileContent = fs.readFileSync(path, "utf-8");

  // Add import statement after the last import
  const importInsertionPoint = fileContent.lastIndexOf("import");
  const nextLineAfterLastImport =
    fileContent.indexOf("\n", importInsertionPoint) + 1;
  const beforeImport = fileContent.slice(0, nextLineAfterLastImport);
  const afterImport = fileContent.slice(nextLineAfterLastImport);

  let importStatement: string;
  switch (provider) {
    case "ThemeProvider":
      importStatement = `import { ThemeProvider } from "${alias}/components/ThemeProvider";`;
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  // check if the provider already exists
  if (fileContent.includes(importStatement)) {
    // consola.info(`Provider ${provider} already exists in layout.tsx`);
    return;
  }
  const modifiedImportContent = `${beforeImport}${importStatement}\n${afterImport}`;

  const rootChildrenText = "{children}";
  let replacementText = "";
  switch (provider) {
    case "ThemeProvider":
      replacementText = `\n<${provider} attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>${rootChildrenText}</${provider}>\n`;
      break;
    default:
      replacementText = `\n<${provider}>${rootChildrenText}</${provider}>\n`;
      break;
  }

  const searchValue = "{children}";
  const newLayoutContent = modifiedImportContent.replace(
    searchValue,
    replacementText
  );
  replaceFile(path, newLayoutContent);
};

export const addAuthCheckToAppLayout = () => {
  const { hasSrc } = readConfigFile();
  const path = `${hasSrc ? "src/" : ""}app/(app)/layout.tsx`;
  const { shared } = getFilePaths();

  const fileContent = fs.readFileSync(path, "utf-8");
  const importStatement = `import { checkAuth } from "${formatFilePath(
    shared.auth.authUtils,
    { prefix: "alias", removeExtension: true }
  )}";\n`;
  const searchText = `  children: React.ReactNode;
}) {
`;
  const replacementText = `  children: React.ReactNode;
}) {
  await checkAuth();
`;
  const newText =
    importStatement + fileContent.replace(searchText, replacementText);
  replaceFile(path, newText);
};
export const addContextProviderToAppLayout = (
  provider:
    | "TrpcProvider"
    | "ShadcnToast"
    | "ClerkProvider"
    | "Navbar"
    | "ThemeProvider"
) => {
  const { hasSrc, alias } = readConfigFile();
  const path = `${hasSrc ? "src/" : ""}app/(app)/layout.tsx`;

  const fileContent = fs.readFileSync(path, "utf-8");

  // Add import statement after the last import
  const lastIndexOfImport = fileContent.lastIndexOf("import");
  const importInsertionPoint = lastIndexOfImport === -1 ? 0 : lastIndexOfImport;
  const nextLineAfterLastImport =
    lastIndexOfImport === -1
      ? 0
      : fileContent.indexOf("\n", importInsertionPoint) + 1;
  const beforeImport = fileContent.slice(0, nextLineAfterLastImport);
  const afterImport = fileContent.slice(nextLineAfterLastImport);

  const { trpc, shared } = getFilePaths();

  let importStatement: string;
  switch (provider) {
    case "TrpcProvider":
      importStatement = `import TrpcProvider from "${formatFilePath(
        trpc.trpcProvider,
        { prefix: "alias", removeExtension: true }
      )}";\nimport { cookies } from "next/headers";`;
      break;
    case "ShadcnToast":
      importStatement = `import { Toaster } from "${alias}/components/ui/sonner";`;
      break;
    case "ClerkProvider":
      importStatement = 'import { ClerkProvider } from "@clerk/nextjs";';
      break;
    case "Navbar":
      importStatement = `import Navbar from "${formatFilePath(
        shared.init.navbarComponent,
        { prefix: "alias", removeExtension: true }
      )}";\nimport Sidebar from "${formatFilePath(
        shared.init.sidebarComponent,
        { prefix: "alias", removeExtension: true }
      )}";`;
      break;
    case "ThemeProvider":
      importStatement = `import { ThemeProvider } from "${alias}/components/ThemeProvider";`;
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  // check if the provider already exists
  if (fileContent.includes(importStatement)) {
    // consola.info(`Provider ${provider} already exists in layout.tsx`);
    return;
  }
  const modifiedImportContent = `${beforeImport}${importStatement}\n${afterImport}`;

  const navbarExists = fileContent.includes("<Navbar />");
  const rootChildrenText = navbarExists
    ? `<div className="flex h-screen">\n<Sidebar />\n<main className="flex-1 md:p-8 pt-2 p-8 overflow-y-auto">\n<Navbar />\n{children}\n</main>\n</div>`
    : "{children}";
  let replacementText = "";
  switch (provider) {
    case "ShadcnToast":
      replacementText = `${rootChildrenText}\n<Toaster richColors />\n`;
      break;
    case "Navbar":
      replacementText = `<div className="flex h-screen">\n<Sidebar />\n<main className="flex-1 md:p-8 pt-2 p-8 overflow-y-auto">\n<Navbar />\n{children}\n</main>\n</div>`;
      break;
    case "TrpcProvider":
      replacementText = `\n<${provider} cookies={cookies().toString()}>${rootChildrenText}</${provider}>\n`;
      break;
    default:
      replacementText = `\n<${provider}>${rootChildrenText}</${provider}>\n`;
      break;
  }

  const searchValue = navbarExists
    ? `<div className="flex h-screen">\n<Sidebar />\n<main className="flex-1 md:p-8 pt-2 p-8 overflow-y-auto">\n<Navbar />\n{children}\n</main>\n</div>`
    : "{children}";
  const newLayoutContent = modifiedImportContent.replace(
    searchValue,
    replacementText
  );
  replaceFile(path, newLayoutContent);
};

export const addContextProviderToAuthLayout = (
  provider: "TrpcProvider" | "ShadcnToast" | "ClerkProvider"
) => {
  const { hasSrc, alias } = readConfigFile();
  const path = `${hasSrc ? "src/" : ""}app/(auth)/layout.tsx`;

  const pathExists = fs.existsSync(path);
  if (!pathExists) {
    return;
  }
  const fileContent = fs.readFileSync(path, "utf-8");

  // Add import statement after the last import
  const importInsertionPoint = fileContent.lastIndexOf("import");
  const nextLineAfterLastImport =
    fileContent.indexOf("\n", importInsertionPoint) + 1;
  const beforeImport = fileContent.slice(0, nextLineAfterLastImport);
  const afterImport = fileContent.slice(nextLineAfterLastImport);

  const { trpc } = getFilePaths();

  let importStatement: string;
  switch (provider) {
    case "TrpcProvider":
      importStatement = `import TrpcProvider from "${formatFilePath(
        trpc.trpcProvider,
        { prefix: "alias", removeExtension: true }
      )}";\nimport { cookies } from "next/headers";`;
      break;
    case "ShadcnToast":
      importStatement = `import { Toaster } from "${alias}/components/ui/sonner";`;
      break;
    case "ClerkProvider":
      importStatement = 'import { ClerkProvider } from "@clerk/nextjs";';
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  // check if the provider already exists
  if (fileContent.includes(importStatement)) {
    // consola.info(`Provider ${provider} already exists in layout.tsx`);
    return;
  }
  const modifiedImportContent = `${beforeImport}${importStatement}\n${afterImport}`;

  const rootChildrenText = "{children}";
  let replacementText = "";
  switch (provider) {
    case "ShadcnToast":
      replacementText = `${rootChildrenText}\n<Toaster richColors />\n`;
      break;
    case "TrpcProvider":
      replacementText = `\n<${provider} cookies={cookies().toString()}>${rootChildrenText}</${provider}>\n`;
      break;
    default:
      replacementText = `\n<${provider}>${rootChildrenText}</${provider}>\n`;
      break;
  }

  const searchValue = "{children}";
  const newLayoutContent = modifiedImportContent.replace(
    searchValue,
    replacementText
  );
  replaceFile(path, newLayoutContent);
};

const installList: { regular: string[]; dev: string[] } = {
  dev: [],
  regular: [],
};
const postInstallTasks: Array<() => Promise<void>> = [];

export const addPostInstallTask = (task: () => Promise<void>) => {
  postInstallTasks.push(task);
};

const manualSteps: string[] = [];

export const addManualStep = (note: string) => {
  manualSteps.push(note);
};

const takeManualSteps = () => manualSteps.splice(0);

export const runPostInstallTasks = async () => {
  await postInstallTasks
    .splice(0)
    .reduce((previous, task) => previous.then(task), Promise.resolve());
};

export const addToInstallList = (packages: {
  regular: string[];
  dev: string[];
}) => {
  installList.regular.push(...packages.regular);
  installList.dev.push(...packages.dev);
};

export const installPackagesFromList = async () => {
  const { preferredPackageManager } = readConfigFile();

  if (installList.dev.length === 0 && installList.regular.length === 0) {
    return;
  }

  const dedupedList = {
    dev: [...new Set(installList.dev)],
    regular: [...new Set(installList.regular)],
  };

  const formattedInstallList = {
    dev: dedupedList.dev
      .map((i) => i.trim())
      .join(" ")
      .trim(),
    regular: dedupedList.regular
      .map((i) => i.trim())
      .join(" ")
      .trim(),
  };
  ensurePnpmBuildsAllowed(preferredPackageManager);
  spinner.text = "Installing Packages";
  await installPackages(formattedInstallList, preferredPackageManager);
};
const shadCnComponentList: string[] = [];
export const addToShadcnComponentList = (components: string[]) =>
  shadCnComponentList.push(...components);
export const installShadcnComponentList = async () => {
  // consola.start("Installing shadcn components:", shadCnComponentList);
  if (shadCnComponentList.length === 0) {
    return;
  }
  await installShadcnUIComponents(shadCnComponentList);
  // consola.ready("Successfully installed components.");
};

const describeOrm = (options: InitOptions) => {
  if (options.orm === "drizzle") {
    return `${chalk.underline("ORM")}: Drizzle (using ${options.dbProvider})`;
  }
  return options.orm === "prisma" ? `${chalk.underline("ORM")}: Prisma` : null;
};

const describeAuth = (options: InitOptions) =>
  options.auth
    ? `${chalk.underline("Authentication")}: ${options.auth === "better-auth" ? "Better Auth" : "Clerk"}`
    : null;

const describeSelectedPackages = (options: InitOptions) => {
  const descriptions = [describeOrm(options), describeAuth(options)];
  const miscDescriptions = {
    resend: `${chalk.underline("Email")}: Resend`,
    sentry: `${chalk.underline("Error Tracking")}: Sentry`,
    stripe: `${chalk.underline("Payments")}: Stripe`,
    trpc: `${chalk.underline("RPC")}: tRPC`,
  } as const;
  for (const packageName of options.miscPackages ?? []) {
    descriptions.push(miscDescriptions[packageName]);
  }
  if (options.componentLib === "shadcn-ui") {
    descriptions.push(`${chalk.underline("Component Library")}: ShadcnUI`);
  }
  return descriptions.filter((description): description is string =>
    Boolean(description)
  );
};

const packageBinaryCommand = (packageManager: string, command: string) => {
  if (packageManager === "npm") {
    return `npm exec -- ${command}`;
  }
  if (packageManager === "pnpm") {
    return `pnpm exec ${command}`;
  }
  if (packageManager === "bun") {
    return `bunx ${command}`;
  }
  return `yarn ${command}`;
};

export const printNextSteps = (
  promptResponses: InitOptions,
  duration: number,
  options?: InitOptions
) => {
  const config = readConfigFile();
  const ppm = config.preferredPackageManager;
  const packagesInstalledList = describeSelectedPackages(promptResponses);

  const wouldHaveSecrets =
    promptResponses.orm ||
    promptResponses.auth ||
    promptResponses.miscPackages?.includes("resend") ||
    promptResponses.miscPackages?.includes("stripe");

  const migrationCommands =
    config.orm === "drizzle"
      ? ["drizzle-kit generate", "drizzle-kit migrate"]
      : ["prisma migrate dev"];
  const dbMigration = [
    "Review the generated auth schema",
    ...migrationCommands.map(
      (command) => `Run \`${packageBinaryCommand(ppm, command)}\``
    ),
    `Run \`${ppm} run dev\``,
    "Open http://localhost:3000 in your browser",
  ];
  const runMigration =
    (promptResponses.orm && promptResponses.includeExample) ||
    (promptResponses.orm && promptResponses.auth !== "clerk") ||
    promptResponses.miscPackages?.includes("stripe");

  const includesStripe = promptResponses.miscPackages?.includes("stripe");

  const nextSteps = [
    ...(wouldHaveSecrets ? ["Add Environment Variables to your .env"] : []),
    ...(runMigration ? dbMigration : []),
    ...(includesStripe
      ? [`Run \`${ppm} run stripe:listen\` in a separate terminal`]
      : []),
    "Build something awesome!",
  ];

  const authProviderInstructions =
    promptResponses.authProviders && promptResponses.authProviders.length > 0
      ? promptResponses.authProviders.map(
          (provider) =>
            `${provider} auth: create credentials at ${AuthProviders[provider].website}\n  (redirect URI: /api/auth/callback/${provider})`
        )
      : [];

  const stripe = [
    "To use Stripe locally, you need the Stripe CLI (https://stripe.com/docs/stripe-cli)",
    "Create Stripe product (https://dashboard.stripe.com/products)",
  ];

  const headless = options.headless ?? false;

  const notes = [
    ...authProviderInstructions,
    ...(promptResponses.miscPackages?.includes("stripe") ? stripe : []),
    ...((headless && promptResponses.miscPackages) || promptResponses.auth
      ? [
          "Remember to add Providers for packages (if you installed trpc, shadcn, or clerk) to your root layout!",
        ]
      : []),
    ...takeManualSteps(),
    "If you have any issues, please open an issue on GitHub\n  (https://github.com/scottjones-dev/gennext/issues)",
  ];

  showNextSteps(packagesInstalledList, nextSteps, notes, duration);
};
export const createNextStepsList = (steps: string[]) => `
${chalk.bold.underline("Next Steps")}
${steps.map((item, i) => `${i + 1}. ${item}`).join("\n")}`;

export const createNotesList = (notes: string[]) => `
${chalk.bold.underline("Notes")}
${notes.map((item) => `- ${item}`).join("\n")}`;

const formatInstallList = (
  installedPackages: string[]
) => `${"The following packages are now installed and configured:"}
- ${installedPackages.join("\n- ")}`;

export const showNextSteps = (
  installedPackages: string[],
  steps: string[],
  notes: string[],
  duration: number
) => {
  const nextStepsFormatted = `🚀 Thanks for using GenNext to kickstart your Next.js app!

${formatInstallList(installedPackages)}

${chalk.bgGreen(
  `[installed and configured in just ${duration / 1000} seconds]`
)}
${createNextStepsList(steps)}
${notes.length > 0 ? createNotesList(notes) : ""}

Hint: use \`gennext generate\` to quickly scaffold entire entities for your application`;
  consola.box(nextStepsFormatted);
};
