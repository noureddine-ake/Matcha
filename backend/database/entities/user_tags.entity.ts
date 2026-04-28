// entities/user_tags.entity.ts
import { ColumnsMap, TableConstraints } from "../define_types.js";
import Model from "../model.js";

export class UserTags extends Model<UserTags> {
  static tableName = "user_tags";

  static columns: ColumnsMap = {
    // ⚠️ no id column — composite PK defined in constraints
    user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    tag_id: {
      type: "INT",
      references: { table: "tags", column: "id", onDelete: "CASCADE" },
    },
  };

  static constraints: TableConstraints = {
    primaryKey: ["user_id", "tag_id"], // PRIMARY KEY (user_id, tag_id)
  };
}
