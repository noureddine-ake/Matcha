// entities/email_verifications.entity.ts
import { ColumnsMap } from "../define_types.js";
import Model from "../model.js";

export class EmailVerifications extends Model<EmailVerifications> {
  static tableName = "email_verifications";

  static columns: ColumnsMap = {
    id: { type: "SERIAL", primaryKey: true },
    user_id: {
      type: "INT",
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    verification_code: { type: "INT", notNull: true },
    expires_at: { type: "TIMESTAMP" },
  };
}
