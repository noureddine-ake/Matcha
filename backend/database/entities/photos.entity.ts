// entities/photos.entity.ts
import { ColumnsMap } from "../define_types.js";
import Model from "../model.js";

export class Photos extends Model<Photos> {
  static tableName = "photos";

  static columns: ColumnsMap = {
    id: { type: "SERIAL", primaryKey: true },
    user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    photo_url: { type: "TEXT", notNull: true },
    is_profile_picture: { type: "BOOLEAN", default: false },
    uploaded_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  };
}
