// entities/messages.entity.ts
import { ColumnsMap } from "../define_types.js";
import Model from "../model.js";

export class Messages extends Model<Messages> {
  static tableName = "messages";

  static columns: ColumnsMap = {
    id: { type: "SERIAL", primaryKey: true },
    sender_user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    receiver_user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    content: { type: "TEXT", notNull: true },
    is_read: { type: "BOOLEAN", default: false },
    sent_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  };
}
