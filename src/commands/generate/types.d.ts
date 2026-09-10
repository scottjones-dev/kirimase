import { DBField, DBType, ORMType } from "../../types.js";
import { ReferenceType } from "./utils.ts";

export interface Schema {
  belongsToUser?: boolean;
  children?: Schema[];
  fields: DBField[];
  includeTimestamps: boolean;
  index: string;
  tableName: string;
}

export type ExtendedSchema = Schema & {
  parents: string[];
};

export interface TypeMapFunctionParams {
  cascade?: boolean;
  name: string;
  notNull?: boolean;
  referenceIdType?: ReferenceType;
  references?: string;
}

export type TypeMapFunction = (params: TypeMapFunctionParams) => string;

export interface TypeMap {
  tableFunc?: string;
  typeMappings: Record<string, TypeMapFunction>;
}

export type DbDriverTypeMapping = Record<DBType, TypeMap>;
export type ORMTypeMap = Record<ORMType, DbDriverTypeMapping>;
