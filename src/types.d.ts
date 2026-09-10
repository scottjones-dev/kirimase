import type { AuthProvider } from "./commands/add/auth/shared/providers.js";

export type DBType = "pg" | "mysql" | "sqlite";
export interface DBProviderItem {
  disabled?: string | boolean;
  name: string;
  value: string;
}
export interface PackageChoice {
  disabled?: string | boolean;
  name: string;
  value: AvailablePackage;
}
export type DBProvider =
  | "postgresjs"
  | "node-postgres"
  | "neon"
  | "vercel-pg"
  | "supabase"
  | "aws"
  | "planetscale"
  | "mysql-2"
  | "better-sqlite3"
  | "turso";
// | "bun-sqlite";

export interface DBProviderOptions {
  mysql: DBProviderItem[];
  pg: DBProviderItem[];
  sqlite: DBProviderItem[];
}
export type PMType = "npm" | "yarn" | "pnpm" | "bun";

// export type FieldType =
//   | "id"
//   | "string"
//   | "text"
//   | "number"
//   | "references"
//   | "boolean";

export type DrizzleColumnType =
  | pgColumnType
  | mysqlColumnType
  | sqliteColumnType;

export type ColumnType = DrizzleColumnType | PrismaColumnType;

export interface DBField<T extends ColumnType = ColumnType> {
  cascade?: boolean;
  name: string;
  notNull?: boolean; // change to required later
  references?: string;
  type: T;
}

// export type DBField = {
//   name: string;
//   type: DrizzleColumnType;
//   references?: string;
//   notNull?: boolean; // change to required later
//   cascade?: boolean;
// };

// extend type or do a base type with prisma field and drizzle field

export type AvailablePackage =
  | "drizzle"
  | "trpc"
  | "better-auth"
  | "shadcn-ui"
  | "prisma"
  | "clerk"
  | "resend"
  | "stripe";

export type PackageType = "orm" | "auth" | "componentLib" | "misc";
export type ComponentLibType = "shadcn-ui";
export type ORMType = "drizzle" | "prisma";
export type AuthType = "better-auth" | "clerk";
export type MiscType = "trpc" | "stripe" | "resend";

export interface Config {
  alias: string;
  auth: AuthType | null;
  componentLib: ComponentLibType | null;
  driver: DBType | null;
  hasSrc: boolean;
  orm: ORMType | null;
  packages: AvailablePackage[];
  preferredPackageManager: PMType;
  provider: DBProvider | null;
  t3: boolean;
}

export type UpdateConfig = Partial<Config>;

export interface InitOptions {
  auth?: AuthType | null;
  authProviders?: AuthProvider[] | null;
  componentLib?: ComponentLibType | null;
  db?: DBType;
  dbProvider?: DBProvider;
  hasSrcFolder?: boolean;
  headless?: boolean;
  includeExample?: boolean;
  miscPackages?: AvailablePackage[];
  orm?: ORMType | null;
  packageManager?: PMType;
}

// export type BuildOptions = {
//   resources?: ("model" | "api_route" | "trpc_route" | "views_and_components")[];
//   table?: string;
//   belongsToUser?: "yes" | "no";
//   index?: string;
//   field?: DBField[];
//   migrate?: "yes" | "no";
// };

export interface ScaffoldSchema {
  fields: DBField[];
  index?: string;
  tableName: string;
}

export type pgColumnType =
  | "varchar"
  | "text"
  | "number"
  | "float"
  | "boolean"
  | "references"
  | "timestamp"
  | "date";
// | "json";

export type mysqlColumnType =
  | "varchar"
  | "text"
  | "number"
  | "float"
  | "boolean"
  | "references"
  | "date"
  | "timestamp";
// | "json";

export type sqliteColumnType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "timestamp"
  | "references";
// | "blob";

export type PrismaColumnType =
  | "String"
  | "Boolean"
  | "Int"
  | "BigInt"
  | "Float"
  | "Decimal"
  | "Boolean"
  | "DateTime"
  | "References";
// | "Json";

export interface DotEnvItem {
  customZodImplementation?: string;
  isOptional?: boolean;
  isUrl?: boolean;
  key: string;
  public?: boolean;
  value: string;
}
