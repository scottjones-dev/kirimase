import { existsSync } from "node:fs";
import type { ORMType } from "../../../../types.js";
import { createFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

export type AuthProvider = "discord" | "google" | "github" | "apple";
type ProviderConfig = {
  [key in AuthProvider]: { code: string; website: string };
};

export const AuthProviders: ProviderConfig = {
  apple: {
    code: `AppleProvider({
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
    })`,
    website: "https://developer.apple.com/account/resources/identifiers/list",
  },
  discord: {
    code: `DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    })`,
    website: "https://discord.com/developers/applications",
  },
  github: {
    code: `GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    })`,
    website: "https://github.com/settings/apps",
  },
  google: {
    code: `GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    })`,
    website: "https://console.cloud.google.com/apis/credentials",
  },
};

export const capitalised = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const AuthDriver: {
  [key in ORMType]: { import: string; adapter: string; package: string };
} = {
  drizzle: {
    adapter: "DrizzleAdapter",
    import: 'import { DrizzleAdapter } from "@auth/drizzle-adapter";',
    package: "@auth/drizzle-adapter",
  },
  prisma: {
    adapter: "PrismaAdapter",
    import: 'import { PrismaAdapter } from "@auth/prisma-adapter"',
    package: "@auth/prisma-adapter",
  },
};

export const checkAndAddAuthUtils = () => {
  const { shared } = getFilePaths();
  const authUtilsPath = formatFilePath(shared.auth.authUtils, {
    prefix: "rootPath",
    removeExtension: false,
  });
  const auExists = existsSync(authUtilsPath);
  if (auExists) {
    return;
  }
  const t3AuthUtilsContent = `import { redirect } from "next/navigation";
import { getServerAuthSession } from "${formatFilePath("server/auth", {
    prefix: "alias",
    removeExtension: false,
  })}";

export type AuthSession = {
  session: {
    user: {
      id: string;
      name?: string;
      email?: string;
      username?: string;
    };
  } | null;
};

export const getUserAuth = async () => {
  const session = await getServerAuthSession();
  return { session } as AuthSession;
};

export const checkAuth = async () => {
  const { session } = await getUserAuth();
  if (!session) redirect("/api/auth/signin");
};
`;
  createFile(authUtilsPath, t3AuthUtilsContent);
};
