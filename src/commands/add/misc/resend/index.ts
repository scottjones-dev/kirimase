import type { AvailablePackage, InitOptions } from "../../../../types.js";
import {
  addPackageToConfig,
  createFile,
  readConfigFile,
} from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import { addToInstallList } from "../../utils.js";
import { resendGenerators } from "./generators.js";

export const addResend = (
  _packagesBeingInstalled: AvailablePackage[],
  options?: InitOptions
) => {
  const { orm, rootPath } = readConfigFile();
  const { resend } = getFilePaths();
  // const packages = packagesBeingInstalled.concat(installedPackages);
  // consola.start("Installing Resend...");

  const {
    generateResendPage,
    generateEmailUtilsTs,
    generateEmailIndexTs,
    generateApiRoute,
    generateEmailLayoutComponent,
    generateEmailTemplateComponent,
  } = resendGenerators;

  if (options.headless === undefined) {
    // 1. Add page at app/resend/page.tsx
    createFile(
      formatFilePath(resend.resendPage, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateResendPage()
    );
  }

  // 2. Add shared layout component at components/emails/EmailLayout.tsx
  createFile(
    formatFilePath(resend.emailLayoutComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateEmailLayoutComponent()
  );
  // 2b. Add component at components/emails/FirstEmailTemplate.tsx
  createFile(
    formatFilePath(resend.firstEmailComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateEmailTemplateComponent()
  );
  // 3. Add route handler at app/api/email/route.ts
  createFile(
    formatFilePath(resend.emailApiRoute, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateApiRoute()
  );

  // 4. Add email utils
  createFile(
    formatFilePath(resend.emailUtils, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateEmailUtilsTs()
  );

  // 5. add email index.ts
  createFile(
    formatFilePath(resend.libEmailIndex, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateEmailIndexTs()
  );

  // 6. Add items to .env
  addToDotEnv([{ key: "RESEND_API_KEY", value: "" }], rootPath, true);
  // 7. Install packages (resend)
  // await installPackages(
  //   {
  //     regular: `resend${orm === null ? " zod @t3-oss/env-nextjs" : ""}`,
  //     dev: "",
  //   },
  //   preferredPackageManager
  // );

  addToInstallList({
    dev: [],
    regular: ["resend", "@react-email/components"],
  });
  if (orm === null || orm === undefined) {
    addToInstallList({ dev: [], regular: ["zod", "@t3-oss/env-nextjs"] });
  }

  addPackageToConfig("resend");
  // consola.success("Resend successfully installed and configured.");
};
