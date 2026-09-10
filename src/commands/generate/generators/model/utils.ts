import { existsSync, readFileSync } from "node:fs";
import type { AuthType } from "../../../../types.js";
import { createFile, readConfigFile, replaceFile } from "../../../../utils.js";
import { getAuthIntegration } from "../../../add/auth/shared/integration.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import type { ORMTypeMap, TypeMap } from "../../types.js";
import {
  formatTableName,
  getReferenceFieldType,
  toCamelCase,
} from "../../utils.js";

export const prismaMappings = {
  typeMappings: {
    BigInt: ({ name, notNull }) =>
      `${toCamelCase(name)} BigInt${notNull ? "" : "?"}`,
    Boolean: ({ name, notNull }) =>
      `${toCamelCase(name)} Boolean${notNull ? "" : "?"}`,
    DateTime: ({ name, notNull }) =>
      `${toCamelCase(name)} DateTime${notNull ? "" : "?"}`,
    // Json: ({ name, notNull }) =>
    //   `${toCamelCase(name)} Json${notNull ? "" : "?"}`,
    Decimal: ({ name, notNull }) =>
      `${toCamelCase(name)} Decimal${notNull ? "" : "?"}`,
    Float: ({ name, notNull }) =>
      `${toCamelCase(name)} Float${notNull ? "" : "?"}`,
    Int: ({ name, notNull }) => `${toCamelCase(name)} Int${notNull ? "" : "?"}`,
    References: ({ references, cascade, notNull }) => {
      const { tableNameSingular, tableNameSingularCapitalised } =
        formatTableName(references);
      // TODO: add relation to other table using addToPrismaModel
      return `${tableNameSingular} ${tableNameSingularCapitalised}${
        notNull ? "" : "?"
      } @relation(fields: [${tableNameSingular}Id], references: [id]${
        cascade ? ", onDelete: Cascade" : ""
      })\n  ${tableNameSingular}Id String`;
    },
    String: ({ name, notNull }) =>
      `${toCamelCase(name)} String${notNull ? "" : "?"}`,
  },
} as TypeMap;

export const createOrmMappings = () => {
  const { provider } = readConfigFile();
  return {
    drizzle: {
      mysql: {
        tableFunc: "mysqlTable",
        typeMappings: {
          boolean: ({ name }) => `boolean("${name}")`,
          date: ({ name }) => `date("${name}")`,
          float: ({ name }) => `real("${name}")`,
          id: ({ name }) =>
            `varchar("${name}", { length: 191 }).primaryKey().$defaultFn(() => nanoid())`,
          number: ({ name }) => `int("${name}")`,
          references: ({
            name,
            references: referencedTable = "REFERENCE",
            cascade,
            referenceIdType = "string",
          }) =>
            `${getReferenceFieldType(referenceIdType).mysql}("${name}"${
              referenceIdType === "string" ? ", { length: 256 }" : ""
            })${
              provider === "planetscale"
                ? ""
                : `.references(() => ${toCamelCase(referencedTable)}.id${
                    cascade ? ', { onDelete: "cascade" }' : ""
                  })`
            }`,
          text: ({ name }) => `text("${name}")`,
          timestamp: ({ name }) => `timestamp("${name}")`,
          varchar: ({ name }) => `varchar("${name}", { length: 256 })`,
          // json: ({ name }) => `json("${name}")`,
        },
      },
      pg: {
        tableFunc: "pgTable",
        typeMappings: {
          boolean: ({ name }) => `boolean("${name}")`,
          date: ({ name }) => `date("${name}")`,
          float: ({ name }) => `real("${name}")`,
          id: ({ name }) =>
            `varchar("${name}", { length: 191 }).primaryKey().$defaultFn(() => nanoid())`,
          number: ({ name }) => `integer("${name}")`,
          references: ({
            name,
            references: referencedTable = "REFERENCE",
            cascade,
            referenceIdType = "string",
          }) =>
            `${getReferenceFieldType(referenceIdType).pg}("${name}"${
              referenceIdType === "string" ? ", { length: 256 }" : ""
            }).references(() => ${toCamelCase(referencedTable)}.id${
              cascade ? ', { onDelete: "cascade" }' : ""
            })`,
          text: ({ name }) => `text("${name}")`,
          // Add more types here as needed
          timestamp: ({ name }) => `timestamp("${name}")`,
          varchar: ({ name }) => `varchar("${name}", { length: 256 })`,
          // json: ({ name }) => `json("${name}")`,
        },
      },
      sqlite: {
        tableFunc: "sqliteTable",
        typeMappings: {
          boolean: ({ name }) => `integer("${name}", { mode: "boolean" })`,
          date: ({ name }) => `integer("${name}", { mode: "timestamp" })`,
          id: ({ name }) =>
            `text("${name}").primaryKey().$defaultFn(() => nanoid())`,
          number: ({ name }) => `integer("${name}")`,
          references: ({
            name,
            references: referencedTable = "REFERENCE",
            cascade,
            referenceIdType = "string",
          }) =>
            `${getReferenceFieldType(referenceIdType).sqlite}("${name}").references(() => ${toCamelCase(referencedTable)}.id${
              cascade ? ', { onDelete: "cascade" }' : ""
            })`,
          string: ({ name }) => `text("${name}")`,
          timestamp: ({ name }) =>
            `integer("${name}", { mode: "timestamp_ms" })`,
          // blob: ({ name }) => `blob("${name}")`,
        },
      },
    },
    prisma: {
      mysql: prismaMappings,
      pg: prismaMappings,
      sqlite: prismaMappings,
    },
  } as ORMTypeMap;
};

export const generateAuthCheck = (belongsToUser: boolean) =>
  belongsToUser ? "\n  const { session } = await getUserAuth();" : "";

export const authForWhereClausePrisma = (belongsToUser: boolean) =>
  belongsToUser ? ", userId: session?.user.id!" : "";

export const updateRootSchema = (
  tableName: string,
  usingAuth?: boolean,
  auth?: AuthType
) => {
  const tableNameCC = toCamelCase(tableName);
  const { drizzle } = getFilePaths();
  const rootSchemaPath = formatFilePath(drizzle.schemaAggregator, {
    prefix: "rootPath",
    removeExtension: false,
  });

  const tableNames =
    getAuthIntegration(auth ?? null)?.schemaExportNames.join(", ") ?? "";

  const newImportStatement = usingAuth
    ? `import { ${tableNames} } from "./auth"`
    : `import { ${tableNameCC} } from "./${tableNameCC}";\n`;

  // check if schema/_root.ts exists
  const rootSchemaExists = existsSync(rootSchemaPath);
  if (rootSchemaExists) {
    // if yes, import new model from model path and add to export -> perhaps replace 'export {' with 'export { new_model,'
    const rootSchemaContents = readFileSync(rootSchemaPath, "utf-8");
    const rootSchemaWithNewExport = rootSchemaContents.replace(
      "export {",
      `export { ${tableNameCC},`
    );

    const importInsertionPoint = rootSchemaWithNewExport.lastIndexOf("import");
    const nextLineAfterLastImport =
      rootSchemaWithNewExport.indexOf("\n", importInsertionPoint) + 1;
    const beforeImport = rootSchemaWithNewExport.slice(
      0,
      nextLineAfterLastImport
    );
    const afterImport = rootSchemaWithNewExport.slice(nextLineAfterLastImport);

    const withNewImport = `${beforeImport}${newImportStatement}${afterImport}`;
    replaceFile(rootSchemaPath, withNewImport);
  } else {
    // if not create schema/_root.ts -> then do same import as above
    createFile(
      rootSchemaPath,
      `${newImportStatement}

export { ${usingAuth ? tableNames : tableNameCC} }`
    );
    // and also update db/index.ts to add extended model import
    const indexDbPath = formatFilePath(drizzle.dbIndex, {
      prefix: "rootPath",
      removeExtension: false,
    });
    const indexDbContents = readFileSync(indexDbPath, "utf-8");
    const updatedContentsWithImport = indexDbContents.replace(
      `import * as schema from "./schema";`,
      `import * as schema from "./schema";
import * as extended from "~/server/db/schema/_root";`
    );
    const updatedContentsFinal = updatedContentsWithImport.replace(
      "{ schema }",
      "{ schema: { ...schema, ...extended } }"
    );
    replaceFile(indexDbPath, updatedContentsFinal);

    // update drizzle config file to add all in server/db/*
    const drizzleConfigPath = "drizzle.config.ts";
    const dConfigContents = readFileSync(drizzleConfigPath, "utf-8");
    const updatedContents = dConfigContents.replace(
      `schema: "./src/server/db/schema.ts",`,
      `schema: "./src/server/db/*",`
    );
    replaceFile(drizzleConfigPath, updatedContents);
  }
};
