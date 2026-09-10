import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { consola } from "consola";
import pluralize from "pluralize";
import type {
  Config,
  DBField,
  DBType,
  DrizzleColumnType,
  ORMType,
  PrismaColumnType,
} from "../../types.js";
import {
  readConfigFile,
  sendEvent,
  updateConfigFileAfterUpdate,
} from "../../utils.js";
import { addPackage } from "../add/index.js";
import { installShadcnComponentList } from "../add/utils.js";
import { initProject } from "../init/index.js";
import { scaffoldAPIRoute } from "./generators/api-route.js";
import { scaffoldModel } from "./generators/model/index.js";
import { createOrmMappings } from "./generators/model/utils.js";
import { addLinkToSidebar } from "./generators/model/views-shared.js";
import { scaffoldServerActions } from "./generators/server-actions.js";
import { scaffoldTRPCRoute } from "./generators/trpc-route.js";
import { scaffoldViewsAndComponents } from "./generators/views.js";
import { scaffoldViewsAndComponentsWithServerActions } from "./generators/views-with-server-actions.js";
import type { ExtendedSchema, Schema } from "./types.js";
import {
  camelCaseToSnakeCase,
  formatTableName,
  getCurrentSchemas,
  printGenerateNextSteps,
  toCamelCase,
} from "./utils.js";

interface Choice<Value> {
  checked?: boolean;
  disabled?: boolean | string;
  name?: string;
  type?: never;
  value: Value;
}

function provideInstructions() {
  consola.info(
    "Quickly generate your Model (schema + queries / mutations), Controllers (API Routes and TRPC Routes), and Views"
  );
}

export type TResource =
  | "model"
  | "api_route"
  | "trpc_route"
  | "views_and_components_trpc"
  | "views_and_components_server_actions"
  | "server_actions";

type TResourceGroup = "model" | "controller" | "view";

const SNAKE_CASE_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

const askForView = async (hasTrpc: boolean) =>
  (await select({
    choices: [
      {
        name: "Server Actions with Optimistic UI",
        value: "views_and_components_server_actions",
      },
      {
        disabled: hasTrpc
          ? false
          : "[You need to have tRPC installed. Run 'kirimase add']",
        name: "tRPC with React Hook Form",
        value: "views_and_components_trpc",
      },
    ],
    message: "Please select the type of view you would like to generate:",
  })) as TResource;

const askForControllers = async (
  hasTrpc: boolean,
  view?: TResource
): Promise<TResource[]> => {
  let trpcDisabled: boolean | string = hasTrpc
    ? false
    : "[You need to have tRPC installed. Run 'kirimase add']";
  if (view === "views_and_components_trpc") {
    trpcDisabled = "[Already generated with your selected view]";
  }
  const choices: Choice<TResource>[] = [
    {
      disabled:
        view === "views_and_components_server_actions"
          ? "[Already generated with your selected view]"
          : false,
      name: "Server Actions",
      value: "server_actions",
    },
    { name: "API Route", value: "api_route" },
    { disabled: trpcDisabled, name: "tRPC", value: "trpc_route" },
  ];
  const availableChoices = view
    ? choices.filter((choice) => !view.includes(choice.value.split("_")[0]))
    : choices;
  return (await checkbox({
    choices: availableChoices,
    message: view
      ? "Please select any additional controllers you would like to generate:"
      : "Please select which controllers you would like to generate:",
  })) as TResource[];
};

async function askForResourceType() {
  const { packages, orm } = readConfigFile();
  const resourcesRequested: TResource[] = [];
  let viewRequested: TResource | undefined;
  const resourcesTypesRequested = (await checkbox({
    choices: [
      {
        disabled:
          orm === null
            ? "[You need to have an orm installed. Run 'kirimase add']"
            : false,
        name: "Model",
        value: "model",
      },
      { name: "Controller", value: "controller" },
      {
        disabled: packages.includes("shadcn-ui")
          ? false
          : "[You need to have shadcn-ui installed. Run 'kirimase add']",
        name: "View",
        value: "view",
      },
    ],
    message: "Please select the resources you would like to generate:",
  })) as TResourceGroup[];

  if (resourcesTypesRequested.includes("model")) {
    resourcesRequested.push("model");
  }

  if (resourcesTypesRequested.includes("view")) {
    viewRequested = await askForView(packages.includes("trpc"));
    if (
      viewRequested === "views_and_components_server_actions" &&
      resourcesTypesRequested.includes("controller")
    ) {
      resourcesRequested.push("server_actions");
    }
    if (
      viewRequested === "views_and_components_trpc" &&
      resourcesTypesRequested.includes("controller")
    ) {
      resourcesRequested.push("trpc_route");
    }
  }

  if (resourcesTypesRequested.includes("controller")) {
    const controllers = await askForControllers(
      packages.includes("trpc"),
      viewRequested
    );
    resourcesRequested.push(...controllers);
  }

  if (viewRequested) {
    resourcesRequested.push(viewRequested);
  }

  return resourcesRequested;
}

async function askForTable() {
  const tableName = await input({
    message: "Please enter the table name (plural and in snake_case):",
    validate: (value) =>
      value.match(SNAKE_CASE_PATTERN)
        ? true
        : "Table name must be in snake_case if more than one word, and plural.",
  });
  return tableName;
}

async function askIfBelongsToUser() {
  const belongsToUser = await confirm({
    default: true,
    message: "Does this model belong to the user?",
  });
  return belongsToUser;
}

async function askForFields(orm: ORMType, dbType: DBType, tableName: string) {
  const currentSchemas = getCurrentSchemas();
  const baseChoices = Object.keys(createOrmMappings()[orm][dbType].typeMappings)
    .filter((fieldTypeName) => fieldTypeName !== "id")
    .map((fieldTypeName) => ({
      name: fieldTypeName.toLowerCase(),
      value: fieldTypeName,
    }));
  const onlyCurrentSchema =
    currentSchemas.length === 1 && currentSchemas[0] === toCamelCase(tableName);
  const choices =
    currentSchemas.length === 0 || onlyCurrentSchema
      ? baseChoices.filter(
          (fieldChoice) => fieldChoice.name.toLowerCase() !== "references"
        )
      : baseChoices;
  const fieldType = (await select({
    choices,
    message: "Please select the type of this field:",
  })) as DrizzleColumnType | PrismaColumnType;

  let field: DBField;
  if (fieldType.toLowerCase() === "references") {
    const references = await select({
      choices: currentSchemas
        .filter((schemaName) => schemaName !== toCamelCase(tableName))
        .map((schemaName) => ({
          name: camelCaseToSnakeCase(schemaName),
          value: camelCaseToSnakeCase(schemaName),
        })),
      message: "Which table do you want it reference?",
    });
    const cascade = await confirm({
      default: false,
      message: "Would you like to cascade on delete?",
    });
    field = {
      cascade,
      name: `${pluralize.singular(references)}_id`,
      notNull: true,
      references,
      type: fieldType,
    };
  } else {
    const fieldName = await input({
      message: "Please enter the field name (in snake_case):",
      validate: (value) =>
        value.match(SNAKE_CASE_PATTERN)
          ? true
          : "Field name must be in snake_case if more than one word.",
    });
    const notNull = await confirm({
      default: true,
      message: "Is this field required?",
    });
    field = { name: fieldName.toLowerCase(), notNull, type: fieldType };
  }

  const addMore = await confirm({
    default: false,
    message: "Would you like to add another field?",
  });
  return addMore
    ? [field, ...(await askForFields(orm, dbType, tableName))]
    : [field];
}

async function askForIndex(fields: DBField[]) {
  const useIndex = await confirm({
    default: false,
    message: "Would you like to set up an index?",
  });

  if (useIndex) {
    const fieldToIndex = await select({
      choices: fields.map(
        (field) =>
          ({
            name: field.name,
            value: field.name,
          }) as Choice<string>
      ),
      message: "Which field would you like to index?",
    });
    return fieldToIndex;
  }
  return null;
}

async function askForTimestamps() {
  return await confirm({
    default: true,
    message: "Would you like timestamps (createdAt, updatedAt)?",
  });
}

async function askForChildModel(parentModel: string) {
  return await confirm({
    default: false,
    message: `Would you like to add a child model? (${parentModel})`,
  });
}

export function preBuild() {
  const config = readConfigFile();

  if (!config) {
    consola.warn("You need to have a config file in order to use generate.");
    initProject();
    return false;
  }

  if (config.orm === undefined) {
    updateConfigFileAfterUpdate();
  }
  return true;
}

async function promptUserForSchema(config: Config, resourceType: TResource[]) {
  const tableName = await askForTable();
  const fields = await askForFields(config.orm, config.driver, tableName);
  const indexedField = await askForIndex(fields);
  const includeTimestamps = await askForTimestamps();
  let belongsToUser = false;
  if (resourceType.includes("model") && config.auth !== null) {
    belongsToUser = await askIfBelongsToUser();
  }
  return {
    belongsToUser,
    fields,
    includeTimestamps,
    index: indexedField,
    tableName,
  } as Schema;
}

// Create a new function to handle the recursion
async function addChildSchemaToParent(
  config: Config,
  resourceType: TResource[],
  parentSchema: Schema
): Promise<Schema> {
  const addChild = await askForChildModel(parentSchema.tableName);
  if (!addChild) {
    return { ...parentSchema, children: [] } as Schema;
  }
  const childSchema = await getSchema(config, resourceType);
  const remaining = await addChildSchemaToParent(
    config,
    resourceType,
    parentSchema
  );

  return {
    ...parentSchema,
    children: [childSchema, ...(remaining.children ?? [])],
  } as Schema;
}

async function getSchema(
  config: Config,
  resourceType: TResource[]
): Promise<Schema> {
  const baseSchema = await promptUserForSchema(config, resourceType);
  if (resourceType.includes("views_and_components_trpc")) {
    return baseSchema;
  }
  return await addChildSchemaToParent(config, resourceType, baseSchema);
}

function getInidividualSchemas(
  schema: Schema,
  parents: string[] = [],
  result: ExtendedSchema[] = []
) {
  // Add the main schema entity to the result array
  const config = readConfigFile();
  const { tableName, children, fields, ...mainSchema } = schema;
  const newParents = [...parents, tableName];
  const immediateParent = parents.at(-1);

  const parentRelationField: DBField[] =
    immediateParent === undefined
      ? []
      : [
          {
            cascade: true,
            name: `${pluralize.singular(immediateParent)}_id`,
            notNull: true,
            references: immediateParent,
            type: config.orm === "prisma" ? "References" : "references",
          },
        ];

  result.push({
    ...mainSchema,
    children,
    fields: [...fields, ...parentRelationField],
    parents,
    tableName,
  });

  // If there are child schemas, recursively call getSchemas() on each one
  if (Array.isArray(children)) {
    for (const child of children) {
      getInidividualSchemas(child, newParents, result);
    }
  }

  return result;
}

export const formatSchemaForGeneration = (schema?: Schema) =>
  getInidividualSchemas(schema);

const generateAllResources = async (
  schemas: ExtendedSchema[],
  resourceType: TResource[],
  index = 0
): Promise<void> => {
  const schemaToGenerate = schemas[index];
  if (!schemaToGenerate) {
    return;
  }
  await generateResources(schemaToGenerate, resourceType);
  await generateAllResources(schemas, resourceType, index + 1);
};

const anonymiseSchemas = (schemas: ExtendedSchema[]): ExtendedSchema[] => {
  const anonymise = (
    schema: ExtendedSchema,
    prefix: string
  ): ExtendedSchema => ({
    ...schema,
    children: schema.children
      ? schema.children.map((c, i) =>
          anonymise(c as ExtendedSchema, `${prefix}Child${i + 1}`)
        )
      : [],
    fields: schema.fields.map((f, i) => ({
      ...f,
      name: `${prefix}Field${i + 1}`,
      references: "",
    })),
    parents: schema.parents.map((_, i) => `${prefix}Parent${i + 1}`),
    tableName: `${prefix}Table`,
  });

  return schemas.map((s, i) => anonymise(s, `Schema${i + 1}`));
};

async function generateResources(
  schema: ExtendedSchema,
  resourceType: TResource[]
) {
  const config = readConfigFile();
  const { tableNameNormalEnglishCapitalised: tnEnglish } = formatTableName(
    schema.tableName
  );

  if (
    (resourceType.includes("views_and_components_trpc") ||
      resourceType.includes("views_and_components_server_actions")) &&
    !config.t3
  ) {
    const addToSidebar = await confirm({
      default: true,
      message: `Would you like to add a link to '${tnEnglish}' in your sidebar?`,
    });
    if (addToSidebar) {
      addLinkToSidebar(schema.tableName);
    }
  }

  if (resourceType.includes("model")) {
    scaffoldModel(schema, config.driver, config.hasSrc);
  }
  if (resourceType.includes("api_route")) {
    scaffoldAPIRoute(schema);
  }
  if (resourceType.includes("trpc_route")) {
    scaffoldTRPCRoute(schema);
  }
  if (resourceType.includes("views_and_components_trpc")) {
    scaffoldViewsAndComponents(schema);
  }
  if (resourceType.includes("server_actions")) {
    scaffoldServerActions(schema);
  }
  if (resourceType.includes("views_and_components_server_actions")) {
    scaffoldViewsAndComponentsWithServerActions(schema);
  }
  await installShadcnComponentList();
}

export async function buildSchema() {
  const ready = preBuild();
  if (!ready) {
    return;
  }

  const config = readConfigFile();

  if (config.orm === null) {
    consola.warn(
      "You need to have an ORM installed in order to use the scaffold command."
    );
    addPackage();
  } else {
    provideInstructions();
    const resourceType = await askForResourceType();
    const schema = await getSchema(config, resourceType);
    // would want to have something that formatted the schema object into:
    // an array of items that needed to be created using code commented below
    // would also need extra stuff like urls
    // TODO

    const schemas = formatSchemaForGeneration(schema);

    await sendEvent("generate", {
      resources: resourceType,
      schemas: JSON.stringify(anonymiseSchemas(schemas)),
    });

    await generateAllResources(schemas, resourceType);
    printGenerateNextSteps(schema, resourceType);
  }
}
