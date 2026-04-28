// entities/profile_views.entity.ts
import { ColumnsMap } from "../define_types.js";
import Model from "../model.js";

export class ProfileViews extends Model<ProfileViews> {
  static tableName = "profile_views";

  static columns: ColumnsMap = {
    id: { type: "SERIAL", primaryKey: true },
    viewer_user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    viewed_user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    viewed_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  };
}
