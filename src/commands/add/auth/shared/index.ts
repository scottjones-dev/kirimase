import type { AuthType } from "../../../../types.js";
import { createFile, readConfigFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { addToShadcnComponentList } from "../../utils.js";
import {
  enableSessionInContext,
  updateTrpcTs,
} from "../next-auth/generators.js";
import {
  createAccountApiTs,
  createAccountCardComponent,
  createAccountPage,
  createSignOutBtn,
  createUpdateEmailCard,
  createUpdateNameCard,
  createUserSettingsComponent,
} from "./generators.js";

export const createAccountSettingsPage = async () => {
  const { orm, rootPath, componentLib, auth } = readConfigFile();
  const { shared } = getFilePaths();
  const withShadCn = componentLib === "shadcn-ui";
  // create account api - clerk has managed component so no need
  if (auth !== "clerk" && auth !== "lucia") {
    createFile(
      formatFilePath(shared.auth.accountApiRoute, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      createAccountApiTs(orm)
    );
  }

  // create account page
  createFile(
    formatFilePath(shared.auth.accountPage, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createAccountPage()
  );

  // create usersettings component
  createFile(
    formatFilePath(shared.auth.userSettingsComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createUserSettingsComponent()
  );

  await scaffoldAccountSettingsUI(rootPath, withShadCn, auth);
};

export const scaffoldAccountSettingsUI = (
  _rootPath: string,
  withShadCn: boolean,
  auth: AuthType
) => {
  const { shared, lucia } = getFilePaths();
  // create updatenamecard
  createFile(
    formatFilePath(shared.auth.updateNameCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createUpdateNameCard(withShadCn, auth !== "lucia", auth === "lucia")
  );

  // create updatenamecard
  createFile(
    formatFilePath(shared.auth.updateEmailCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createUpdateEmailCard(withShadCn, auth !== "lucia", auth === "lucia")
  );

  // create accountcard components
  createFile(
    formatFilePath(shared.auth.accountCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createAccountCardComponent(withShadCn)
  );

  // create navbar component
  // createFile(
  //   formatFilePath(shared.init.navbarComponent, {
  //     prefix: "rootPath",
  //     removeExtension: false,
  //   }),
  //   createNavbar(withShadCn, auth === "clerk", auth)
  // );

  // TODO FIX THIS
  if (withShadCn && auth !== "lucia") {
    createFile(
      formatFilePath(lucia.signOutButtonComponent, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      createSignOutBtn()
    );
  }
  // add navbar to root layout
  // addContextProviderToLayout("Navbar");
  if (withShadCn) {
    // consola.start("Installing Card component for account page...");
    // await installShadcnUIComponents(["card"]);
    addToShadcnComponentList(["card"]);
  }
};

export const updateTrpcWithSessionIfInstalled = () => {
  const { packages, t3 } = readConfigFile();
  if (packages.includes("trpc") && !t3) {
    updateTrpcTs();
    enableSessionInContext();
  }
};
