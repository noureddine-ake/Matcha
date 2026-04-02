// entities/email_verifications.entity.ts
import { ColumnsMap } from "../define_types.js";

export const emailVerificationsColumns: ColumnsMap = {
  id: { type: "SERIAL", primaryKey: true },
  user_id: { type: "INT", references: { table: "users", column: "id", onDelete: "CASCADE" } },
  verification_code: { type: "INT", notNull: true },
  expires_at: { type: "TIMESTAMP" },
};
