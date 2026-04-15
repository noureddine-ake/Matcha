// entities/users.entity.ts
import { ColumnsMap } from "../define_types.js";
import Model from "../model.js";

export class User extends Model<User> {
  static tableName = "users";
  
  static columns: ColumnsMap = {
    id: { type: "SERIAL", primaryKey: true },
    email: { type: "VARCHAR(255)", unique: true, notNull: true },
    username: { type: "VARCHAR(100)", unique: true, notNull: true },
    first_name: { type: "VARCHAR(100)" },
    last_name: { type: "VARCHAR(100)" },
    password_hash: { type: "VARCHAR(255)", notNull: true },
    is_verified: { type: "BOOLEAN", default: false },
    verification_token: { type: "VARCHAR(255)" },
    completed_profile: { type: "BOOLEAN", default: false },
    reset_token: { type: "VARCHAR(255)" },
    pending_email: { type: "VARCHAR(255)" },
    pending_email_token: { type: "VARCHAR(255)" },
    created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
    updated_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  };
}