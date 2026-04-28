// entities/reports.entity.ts
import { ColumnsMap, TableConstraints } from "../define_types.js";
import Model from "../model.js";

export class Reports extends Model<Reports> {
  static tableName = "reports";

  static columns: ColumnsMap = {
    id: { type: "SERIAL", primaryKey: true },
    reporter_user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    reported_user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    reason: { type: "TEXT" },
    created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  };

  static constraints: TableConstraints = {
    unique: ["reporter_user_id", "reported_user_id"],
  };
}
