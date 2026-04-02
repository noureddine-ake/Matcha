// entities/notifications.entity.ts
import { ColumnsMap } from "../define_types.js";

export const notificationsColumns: ColumnsMap = {
  id: { type: "SERIAL", primaryKey: true },
  user_id: { type: "INT", references: { table: "users", column: "id", onDelete: "CASCADE" } },
  type: { type: "VARCHAR(100)" },
  from_user_id: { type: "INT", references: { table: "users", column: "id" } }, // ⚠️ intentionally no onDelete
  is_read: { type: "BOOLEAN", default: false },
  created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
};