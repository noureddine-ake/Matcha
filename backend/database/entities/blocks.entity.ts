// entities/blocks.entity.ts
import { ColumnsMap, TableConstraints } from "../define_types.js";
import Model from "../model.js";

export class Blocks extends Model<Blocks> {
  static tableName = "blocks";

  static columns: ColumnsMap = {
    id: { type: "SERIAL", primaryKey: true },
    blocker_user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    blocked_user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  };

  static constraints: TableConstraints = {
    unique: ["blocker_user_id", "blocked_user_id"],
  };
}
