export type AuthProvider = "apple" | "discord" | "github" | "google";

interface ProviderConfig {
  envPrefix: string;
  website: string;
}

export const AuthProviders: Record<AuthProvider, ProviderConfig> = {
  apple: {
    envPrefix: "APPLE",
    website: "https://developer.apple.com/account/resources/identifiers/list",
  },
  discord: {
    envPrefix: "DISCORD",
    website: "https://discord.com/developers/applications",
  },
  github: {
    envPrefix: "GITHUB",
    website: "https://github.com/settings/apps",
  },
  google: {
    envPrefix: "GOOGLE",
    website: "https://console.cloud.google.com/apis/credentials",
  },
};
