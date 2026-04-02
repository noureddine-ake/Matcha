// entities/reports.entity.ts
import { ColumnsMap, TableConstraints } from "../define_types.js";

export const reportsColumns: ColumnsMap = {
  id: { type: "SERIAL", primaryKey: true },
  reporter_user_id: { type: "INT", references: { table: "users", column: "id", onDelete: "CASCADE" } },
  reported_user_id: { type: "INT", references: { table: "users", column: "id", onDelete: "CASCADE" } },
  reason: { type: "TEXT" },
  created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
};

export const reportsConstraints: TableConstraints = {
  unique: ["reporter_user_id", "reported_user_id"],
};