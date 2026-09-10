import type { AuthType } from "../../../../types.js";

export interface AuthIntegration {
  ownsUserRecords: boolean;
  schemaExportNames: readonly string[];
  userModelName: string | null;
  userTableName: string | null;
}

const integrations: Record<AuthType, AuthIntegration> = {
  clerk: {
    ownsUserRecords: false,
    schemaExportNames: [],
    userModelName: null,
    userTableName: null,
  },
};

export const getAuthIntegration = (
  auth: AuthType | null
): AuthIntegration | null => (auth ? integrations[auth] : null);

export const authUsesDatabaseUser = (auth: AuthType | null) =>
  getAuthIntegration(auth)?.ownsUserRecords === true;
