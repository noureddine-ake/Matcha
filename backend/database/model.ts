// Base Model class that all entities will extend
import { ColumnsMap } from "./define_types.js";
import { TableConstraints } from "./define_types.js";
import orm from "./orm.js";
import { QueryBuilder } from "./query_builder.js";

abstract class Model<T> {
  static tableName: string;
  static columns: ColumnsMap;
  static querybuilder: QueryBuilder = new QueryBuilder();

  // Method to define table in DB
  static define(constraints?: TableConstraints): Promise<void> {
    return orm.define(this.tableName, this.columns, constraints);
  }

  // Methods to maniputate tables in DB
  static select(columns: string[]): QueryBuilder {
    return this.querybuilder.select(this.tableName, columns);
  }

  static insert(data: Record<string, any>): QueryBuilder {
    return this.querybuilder.insert(this.tableName, data);
  }

  static update(set: Record<string, any>): QueryBuilder {
    return this.querybuilder.update(this.tableName, set);
  }

  static delete(): QueryBuilder {
    return this.querybuilder.delete(this.tableName);
  }
}

export default Model;