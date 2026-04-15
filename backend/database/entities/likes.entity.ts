// entities/likes.entity.ts
import { ColumnsMap } from "../define_types.js";
import Model from "../model.js";

export class Likes extends Model<Likes> {
  static tableName = "likes";

  static columns: ColumnsMap = {
    id: { type: "SERIAL", primaryKey: true },
    liker_user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    liked_user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  };
}
