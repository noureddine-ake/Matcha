// entities/tags.entity.ts
import { ColumnsMap } from "../define_types.js";

export const tagsColumns: ColumnsMap = {
  id: { type: "SERIAL", primaryKey: true },
  name: { type: "VARCHAR(100)", unique: true, notNull: true },
  created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
};