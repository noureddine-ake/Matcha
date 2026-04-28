// entities/profiles.entity.ts
import { ColumnsMap } from "../define_types.js";
import Model from "../model.js";

export class Profiles extends Model<Profiles> {
  static tableName = "profiles";

  static columns: ColumnsMap = {
    id: { type: "SERIAL", primaryKey: true },
    user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    gender: { type: "VARCHAR(50)" },
    sexual_preference: { type: "VARCHAR(50)" },
    biography: { type: "TEXT" },
    birth_date: { type: "DATE" },
    fame_rating: { type: "DECIMAL(5,2)", default: 0 },
    latitude: { type: "DECIMAL(9,6)" },
    longitude: { type: "DECIMAL(9,6)" },
    city: { type: "VARCHAR(100)" },
    country: { type: "VARCHAR(100)" },
    is_online: { type: "BOOLEAN", default: false },
    last_seen: { type: "TIMESTAMP" },
    report_count: { type: "INTEGER", default: 0 },
    created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
    updated_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  };
}
