// entities/likes.entity.ts
import { ColumnsMap } from "../define_types.js";

export const likesColumns: ColumnsMap = {
  id: { type: "SERIAL", primaryKey: true },
  liker_user_id: { type: "INT", references: { table: "users", column: "id", onDelete: "CASCADE" } },
  liked_user_id: { type: "INT", references: { table: "users", column: "id", onDelete: "CASCADE" } },
  created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
};