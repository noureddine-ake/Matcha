# Database Layer Architecture Schema

## 📁 Folder Structure

```
backend/database/
├── 📄 define_types.ts     # Type definitions (SQL types, column attributes)
├── 📄 select_types.ts     # Query builder types (JoinOptions, OptionsTypes)
├── 📄 orm.ts             # Core ORM class (PostgreSQL Pool)
├── 📄 index.ts           # initDB() - initializes all tables
├── 📄 entities/          # Entity definitions (12 files)
│   ├── index.ts         # Exports all entities
│   ├── users.entity.ts   # Users table schema
│   ├── profiles.entity.ts
│   ├── photos.entity.ts
│   ├── likes.entity.ts
│   ├── messages.entity.ts
│   ├── notifications.entity.ts
│   ├── tags.entity.ts
│   ├── user_tags.entity.ts
│   ├── blocks.entity.ts
│   ├── reports.entity.ts
│   ├── profile_views.entity.ts
│   └── email_verifications.entity.ts
└── (future) Model.ts     # Base Model class (after exercises)
```

---

## 🏗️ Class Diagram (Current)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            define_types.ts                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  SQLType         ──────► "SERIAL" | "TEXT" | "BOOLEAN" | "INT" | ...      │
│  DefaultValue    ──────► boolean | number | SQLFunction | string | null   │
│  ColumnReference ─────► { table, column, onDelete? }                       │
│  ColumnAttributes ─────► { type, primaryKey?, unique?, notNull?, ... }   │
│  TableConstraints ─────► { primaryKey?, unique? }                         │
│  ColumnsMap      ──────► Record<string, ColumnAttributes>                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            select_types.ts                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  JoinTypes        ──────► "LEFT" | "RIGHT" | "INNER"                       │
│  Agregate         ──────► "COUNT" | "SUM" | "AVG" | "MAX" | "MIN"          │
│  JoinOptions      ──────► { type, on }                                      │
│  OptionsTypes     ──────► { columns, joins?, where?, groupBy?, ... }       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                orm.ts                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  class ORM {                                                                │
│    private connection: Pool    ◄─── PostgreSQL connection pool             │
│                                                                          │
│    define(tableName, columns, constraints?)  ──► Promise<void>           │
│         │                                                                     │
│         ▼                                                                     │
│    ┌──────────────────────────────────────────────────────────────┐        │
│    │ 1. Convert ColumnsMap to SQL string                           │        │
│    │ 2. Build: CREATE TABLE IF NOT EXISTS table (columns)          │        │
│    │ 3. pool.query(sql)                                            │        │
│    └──────────────────────────────────────────────────────────────┘        │
│                                                                          │
│    select(tableName, options)  ──► Promise<any>  (⚠️ INCOMPLETE)          │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ imports types
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              entities/                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐  │
│  │users.entity.ts   │     │profiles.entity.ts│     │photos.entity.ts  │  │
│  ├──────────────────┤     ├──────────────────┤     ├──────────────────┤  │
│  │usersColumns:     │     │profilesColumns: │     │photosColumns:   │  │
│  │  id: { type:     │     │  user_id: {      │     │  id: { type:     │  │
│  │    "SERIAL",     │     │    type: "INT",  │     │    "SERIAL",     │  │
│  │    primaryKey    │     │    references:   │     │    primaryKey   │  │
│  │  },              │     │    { table:      │     │  },              │  │
│  │  email: {        │     │      "users",    │     │  user_id: {     │  │
│  │    type:         │     │      "id",       │     │    type: "INT", │  │
│  │    "VARCHAR(255)"│     │      "CASCADE"   │     │    references:  │  │
│  │  },              │     │    }            │     │    {...}         │  │
│  │  ...             │     │  },             │     │  },              │  │
│  └──────────────────┘     │  ...             │     │  ...             │  │
│         │                  └──────────────────┘     └──────────────────┘  │
│         │                         │                        │              │
│         │                         ▼                        ▼              │
│         │                ┌──────────────────┐     ┌──────────────────┐    │
│         │                │likes.entity.ts   │     │messages.entity.ts│    │
│         │                ├──────────────────┤     ├──────────────────┤    │
│         │                │likesColumns: {...}     │messagesColumns: {...}│
│         │                └──────────────────┘     └──────────────────┘    │
│         │                                                             │
│         └──────────────────► index.ts ◄── imports all columns         │
│                                │                                          │
│                                ▼                                          │
│                    ┌─────────────────────────────┐                       │
│                    │         initDB()             │                       │
│                    ├─────────────────────────────┤                       │
│                    │ Wave 1: users, tags         │                       │
│                    │ Wave 2: profiles, photos,   │                       │
│                    │        likes, messages...   │                       │
│                    │ Wave 3: user_tags           │                       │
│                    └─────────────────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Define    │     │   Select    │     │   Insert    │
│   Types     │     │   Types     │     │   Update    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                  │                   │
       ▼                  ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                           ORM                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  define(tableName, columns, constraints?)                │ │
│  │     │                                                    │ │
│  │     ▼                                                    │ │
│  │  ColumnsToQuery() ──► getQueryAtt() ──► defaultToSQL() │ │
│  │                                                          │ │
│  │  Result: CREATE TABLE IF NOT EXISTS users (SQL string)  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                                │
│                              ▼                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  select(tableName, options)  [INCOMPLETE]              │ │
│  │     │                                                  │ │
│  │     ▼                                                  │ │
│  │  Would build: SELECT columns FROM table WHERE ...      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  PostgreSQL     │
                    │     Pool        │
                    └─────────────────┘
```

---

## 🧩 After Class-Based Refactoring (Target)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Model.ts                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  abstract class Model<T> {                                                  │
│    static tableName: string           ◄── Each entity defines               │
│    static columns: ColumnsMap        ◄── Its own columns                   │
│                                                                          │
│    static define(constraints?): Promise<void>    ◄── Calls ORM.define()  │
│    static select(options): Promise<any>          ◄── Calls ORM.select()   │
│    static findById(id): Promise<T>              ◄── Custom finder       │
│    static findBy(field, value): Promise<T>      ◄── Custom finder       │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
           ▲
           │ extends
           │
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Entities/                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ class User extends Model<User> {                                   │    │
│  │   static tableName = "users";                                       │    │
│  │   static columns: ColumnsMap = {                                    │    │
│  │     id: { type: "SERIAL", primaryKey: true },                      │    │
│  │     email: { type: "VARCHAR(255)", unique: true, notNull: true },   │    │
│  │     ...                                                             │    │
│  │   };                                                                │    │
│  │                                                                      │    │
│  │   // Custom methods                                                  │    │
│  │   static findById(id) { return this.select({where: `id=${id}`}); }  │    │
│  │   static findByEmail(email) { ... }                                  │    │
│  │ }                                                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│           ▲                                                                │
│           │ extends (12 entities)                                          │
│           │                                                                │
│  ┌────────┴────────┬─────────┬─────────┬──────────┬──────────┬──────────┐ │
│  │      │          │         │         │          │          │          │ │
│  ▼      ▼          ▼         ▼         ▼          ▼          ▼          ▼ │
│ ┌────┐ ┌────┐  ┌──────┐ ┌────┐  ┌──────┐ ┌────┐  ┌───────┐ ┌──────┐  │
│ │User│ │Prof│  │Photo │ │Like│  │Message│ │Notif│  │Tags   │ │Block │  │
│ │    │ │ile │  │      │ │    │  │      │ │    │  │       │ │      │  │
│ └────┘ └────┘  └──────┘ └────┘  └──────┘ └────┘  └───────┘ └──────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📞 Communication Patterns

### Current (Function-Based)

```typescript
// Step 1: Define types
import { ColumnsMap } from "./define_types.js";

// Step 2: ORM works with types
import orm from "./orm.js";
import { usersColumns } from "./entities/users.entity.js";

// Step 3: Call ORM methods
await orm.define("users", usersColumns);
await orm.select("users", { columns: ["id", "email"] });
```

### After Refactoring (Class-Based)

```typescript
// Step 1: Import entity class
import User from "./entities/User.js";

// Step 2: Call static methods on entity
await User.define();              // Uses User.tableName + User.columns
await User.select({ columns: ["id", "email"] });
await User.findById(1);           // Custom finder
await User.findByEmail("a@b.c");  // Custom finder
```

---

## 🎯 Key Relationships

| From | To | Relationship |
|------|-----|--------------|
| `orm.ts` | `define_types.ts` | Imports types |
| `orm.ts` | `select_types.ts` | Imports options types |
| `entities/*.ts` | `define_types.ts` | Uses `ColumnsMap` |
| `index.ts` | `entities/index.ts` | Imports all entity columns |
| `index.ts` | `orm.ts` | Calls `orm.define()` |
| (future) `Model.ts` | `orm.ts` | Wraps ORM static methods |
| (future) `entities/*.ts` | `Model.ts` | Extends base Model class |

---

## 🔑 Key Files Purpose

| File | Purpose | Exports |
|------|---------|---------|
| `define_types.ts` | SQL/Schema types | `SQLType`, `ColumnAttributes`, `ColumnsMap` |
| `select_types.ts` | Query builder types | `OptionsTypes`, `JoinOptions`, `Agregate` |
| `orm.ts` | Database operations | `ORM` class (singleton) |
| `entities/index.ts` | Entity aggregation | All entity columns |
| `index.ts` | Initialization | `initDB()` function |
| `Model.ts` (future) | Base class | `Model` abstract class |
