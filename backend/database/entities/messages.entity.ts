// entities/messages.entity.ts
import { ColumnsMap } from "../define_types.js";

export const messagesColumns: ColumnsMap = {
  id: { type: "SERIAL", primaryKey: true },
  sender_user_id: { type: "INT", references: { table: "users", column: "id", onDelete: "CASCADE" } },
  receiver_user_id: { type: "INT", references: { table: "users", column: "id", onDelete: "CASCADE" } },
  content: { type: "TEXT", notNull: true },
  is_read: { type: "BOOLEAN", default: false },
  sent_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
};