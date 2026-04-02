// entities/user_tags.entity.ts
import { ColumnsMap, TableConstraints } from "../define_types.js";

export const userTagsColumns: ColumnsMap = {
  // ⚠️ no id column — composite PK defined in constraints
  user_id: { type: "INT", references: { table: "users", column: "id", onDelete: "CASCADE" } },
  tag_id: { type: "INT", references: { table: "tags", column: "id", onDelete: "CASCADE" } },
};

export const userTagsConstraints: TableConstraints = {
  primaryKey: ["user_id", "tag_id"],  // PRIMARY KEY (user_id, tag_id)
};