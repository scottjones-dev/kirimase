import { createFile, readConfigFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { addToShadcnComponentList } from "../../utils.js";
import {
  createAccountCardComponent,
  createAccountPage,
  createUpdateEmailCard,
  createUpdateNameCard,
  createUserSettingsComponent,
} from "./generators.js";

export const createAccountSettingsPage = () => {
  const { componentLib } = readConfigFile();
  const { shared } = getFilePaths();
  const withShadCn = componentLib === "shadcn-ui";
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

  scaffoldAccountSettingsUI(withShadCn);
};

export const scaffoldAccountSettingsUI = (withShadCn: boolean) => {
  const { shared } = getFilePaths();
  // create updatenamecard
  createFile(
    formatFilePath(shared.auth.updateNameCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createUpdateNameCard(withShadCn, true, false)
  );

  // create updatenamecard
  createFile(
    formatFilePath(shared.auth.updateEmailCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createUpdateEmailCard(withShadCn, true, false)
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

  // add navbar to root layout
  // addContextProviderToLayout("Navbar");
  if (withShadCn) {
    // consola.start("Installing Card component for account page...");
    // await installShadcnUIComponents(["card"]);
    addToShadcnComponentList(["card"]);
  }
};
