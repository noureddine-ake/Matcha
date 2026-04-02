// ─── SQL Types ───────────────────────────────────────────────────────────────

export type SQLType =
  | "SERIAL"
  | "TEXT"
  | "BOOLEAN"
  | "INT"
  | "INTEGER"
  | "DATE"
  | "TIMESTAMP"
  | `VARCHAR(${number})`           // VARCHAR(255), VARCHAR(100) ...
  | `DECIMAL(${number},${number})` // DECIMAL(5,2), DECIMAL(9,6) ...

// ─── Default Values ──────────────────────────────────────────────────────────

export type SQLFunction = "CURRENT_TIMESTAMP" | "NOW()"  // raw SQL, no quotes

export type DefaultValue =
  | boolean         // → DEFAULT TRUE / DEFAULT FALSE
  | number          // → DEFAULT 0 / DEFAULT 18 ...
  | SQLFunction     // → DEFAULT CURRENT_TIMESTAMP (no quotes)
  | string          // → DEFAULT 'some_string'     (quoted)
  | null            // → DEFAULT NULL

// ─── Foreign Key Reference ───────────────────────────────────────────────────

export type OnDeleteAction = "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION"

export type ColumnReference = {
  table  : string
  column : string
  onDelete?: OnDeleteAction        // default: no action if omitted
}

// ─── Per-Column Attributes ───────────────────────────────────────────────────

export type ColumnAttributes = {
  type        : SQLType
  primaryKey ?: boolean            // single-column PK
  unique     ?: boolean            // column-level UNIQUE
  notNull    ?: boolean            // NOT NULL
  default    ?: DefaultValue       // DEFAULT ...
  references ?: ColumnReference    // REFERENCES table(col) ON DELETE ...
}

// ─── Table-Level Constraints (composite PKs, multi-col UNIQUE) ───────────────

export type TableConstraints = {
  primaryKey ?: string[]           // PRIMARY KEY (user_id, tag_id)
  unique     ?: string[]           // UNIQUE(blocker_user_id, blocked_user_id)
                                   // pass multiple → multiple constraints
}

// ─── The define() Signature ──────────────────────────────────────────────────

export type ColumnsMap = Record<string, ColumnAttributes>
