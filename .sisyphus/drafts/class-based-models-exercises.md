# Class-Based Models Refactoring Exercises

Progressive exercises to transform your ORM from function-based to class-based architecture.

---

## 📋 Overview

**Goal:** Refactor your database layer so each entity (User, Profile, etc.) becomes a class with methods like `Entity.define()` and `Entity.select()`.

**Starting Point:** Your current code uses `orm.define("users", columns)` function calls.

**End Point:** You'll have `User.define()`, `User.select()`, `Profile.findById()`, etc.

---

## Step 1: Static Methods Basics

### 📖 Concept to Read First

Research: **JavaScript static methods** — what they are and when to use them.

**Search terms:** "javascript static method class" "ES6 class static"

### 🎯 Exercise

Create a file `backend/database/exercises/step1.js`:

```javascript
// Create a Calculator class with static methods
// - add(a, b) returns a + b
// - subtract(a, b) returns a - b
// - multiply(a, b) returns a * b

// Usage should be:
// Calculator.add(5, 3)       // returns 8
// Calculator.subtract(10, 4) // returns 6
// Calculator.multiply(3, 4)  // returns 12

// Test all three methods with console.log
```

### ✅ Success Criteria

- [ ] Class has `static add`, `static subtract`, `static multiply`
- [ ] All methods return correct values
- [ ] No instance creation needed (Calculator.add, not new Calculator().add)

---

## Step 2: Static Properties

### 📖 Concept to Read First

Research: **JavaScript static properties in classes**.

**Search terms:** "javascript static property class"

### 🎯 Exercise

Extend `step1.js` to `backend/database/exercises/step2.js`:

```javascript
// Add a static property 'version' to Calculator
// Add a static property 'operations' that stores an array of available operations

// Usage:
// Calculator.version        // "1.0.0"
// Calculator.operations    // ["add", "subtract", "multiply"]
```

### ✅ Success Criteria

- [ ] `Calculator.version` returns "1.0.0"
- [ ] `Calculator.operations` returns array with all operation names

---

## Step 3: Class Inheritance with extends

### 📖 Concept to Read First

Research: **JavaScript class inheritance (extends, super)**.

**Search terms:** "javascript class extends super constructor"

### 🎯 Exercise

Create `backend/database/exercises/step3.js`:

```javascript
// 1. Create a base class 'Model' with:
//    - constructor that accepts tableName
//    - a static property 'tableName' set from constructor

// 2. Create a 'User' class that extends Model
//    - should NOT need to pass tableName in constructor
//    - User.tableName should equal "users"

// Usage:
// const user = new User();
// user.tableName  // "users" (automatically set)

// Hint: Use super() in User constructor
```

### ✅ Success Criteria

- [ ] `User` extends `Model`
- [ ] `new User()` automatically sets `tableName = "users"`
- [ ] Base `Model` class reusable for any table name

---

## Step 4: Method Chaining with `this`

### 📖 Concept to Read First

Research: **JavaScript method chaining returning this**.

**Search terms:** "javascript method chaining this keyword"

### 🎯 Exercise

Create `backend/database/exercises/step4.js`:

```javascript
// Create a QueryBuilder class with:
// - select(fields: string[]) returns this
// - from(table: string) returns this
// - where(condition: string) returns this
// - limit(n: number) returns this

// Each method should store the value and return this

// Usage:
// const query = new QueryBuilder()
//   .select(["id", "email"])
//   .from("users")
//   .where("id = 1")
//   .limit(10);

// console.log(query.select)   // ["id", "email"]
// console.log(query.from)    // "users"
// console.log(query.where)   // "id = 1"
// console.log(query.limit)    // 10
```

### ✅ Success Criteria

- [ ] All 4 methods chain together
- [ ] Each method stores its value on the instance
- [ ] All methods return `this`

---

## Step 5: Build Query String from QueryBuilder

### 📖 Concept to Read First

Research: **JavaScript array join method**.

**Search terms:** "javascript array join method"

### 🎯 Exercise

Extend `step4.js` to `step5.js`:

```javascript
// Add a 'toString()' or 'build()' method to QueryBuilder
// that returns the complete SQL query string

// Output format:
// "SELECT id, email FROM users WHERE id = 1 LIMIT 10"

// Usage:
// new QueryBuilder()
//   .select(["id", "email"])
//   .from("users")
//   .where("id = 1")
//   .limit(10)
//   .build()

// Should return: "SELECT id, email FROM users WHERE id = 1 LIMIT 10"
```

### ✅ Success Criteria

- [ ] `.build()` returns proper SQL string
- [ ] Handles missing clauses (no WHERE, no LIMIT, etc.)
- [ ] Columns joined with comma and space

---

## Step 6: Connect to Your Actual ORM

### 📖 Concept to Read First

Research: **How to call parent class static methods**.

**Search terms:** "javascript call parent static method from child class"

### 🎯 Exercise

Create `backend/database/exercises/step6.js`:

```javascript
// Copy your orm.ts define() method logic into a new QueryBuilder class
// that can actually run against your database

// Pattern to follow:
// - Define a static 'define' method that calls your orm.define()
// - Use static tableName from the child class

// Usage pattern (later):
// class User extends Model {
//   static tableName = "users";
//   static define() { return ORM.define(this.tableName, this.columns); }
// }
```

### ✅ Success Criteria

- [ ] Understand how static methods access `this`
- [ ] Know how to pass class properties to another function

---

## Step 7: Refactor ORM to Support Static Pattern

### 📖 Concept to Read First

Review your current `orm.ts` code again.

### 🎯 Exercise

Modify `backend/database/orm.ts`:

```typescript
// Add a static 'define' method that wraps the instance method
// Add a static 'select' method that wraps the instance method

class ORM {
  // ... keep existing code ...

  // NEW: Static wrappers
  static define(tableName: string, columns: ColumnsMap, constraints?: TableConstraints): Promise<void> {
    return instance.define(tableName, columns, constraints);
  }

  static select(tableName: string, options: OptionsTypes): Promise<any> {
    return instance.select(tableName, options);
  }
}

// Export both the instance AND the class
export default ORM;
export { ORM };
```

### ✅ Success Criteria

- [ ] `ORM.define()` works same as `orm.define()`
- [ ] Both instance and static access work

---

## Step 8: Create Base Model Class

### 📖 Concept to Read First

Review **Step 3** solution (class inheritance).

### 🎯 Exercise

Create `backend/database/Model.ts`:

```typescript
// Base Model class that all entities will extend

import { ORM } from "./orm.js";
import { ColumnsMap, TableConstraints } from "./define_types.js";
import { OptionsTypes } from "./select_types.js";

abstract class Model<T> {
  // Each subclass must define these
  static tableName: string;
  static columns: ColumnsMap;

  // Method to define table in DB
  static define(constraints?: TableConstraints): Promise<void> {
    return ORM.define(this.tableName, this.columns, constraints);
  }

  // Method to select from table
  static select(options: OptionsTypes): Promise<any> {
    return ORM.select(this.tableName, options);
  }
}

export default Model;
```

### ✅ Success Criteria

- [ ] `Model` is an abstract class
- [ ] Subclasses can call `this.tableName` and `this.columns`
- [ ] `define()` and `select()` work from any subclass

---

## Step 9: Refactor One Entity (User)

### 📖 Concept to Read First

Review your current `users.entity.ts`.

### 🎯 Exercise

Create `backend/database/entities/User.ts`:

```typescript
// Refactor users.entity.ts to a class

import Model from "../Model.js";
import { ColumnsMap, TableConstraints } from "../define_types.js";

class User extends Model<User> {
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

  // Custom query methods
  static findById(id: number) {
    return this.select({
      columns: ["*"],
      where: `id = ${id}`
    });
  }

  static findByEmail(email: string) {
    return this.select({
      columns: ["*"],
      where: `email = '${email}'`
    });
  }
}

export default User;
```

### ✅ Success Criteria

- [ ] `User` extends `Model`
- [ ] Can call `User.define()` without arguments
- [ ] `User.findById(1)` returns user with id 1

---

## Step 10: Add All Entities as Classes

### 📖 Concept to Read First

Review other entity files in `backend/database/entities/`.

### 🎯 Exercise

Refactor all entity files to classes:

```
- tags.entity.ts         → Tags.ts
- profiles.entity.ts    → Profile.ts
- photos.entity.ts      → Photo.ts
- likes.entity.ts       → Like.ts
- messages.entity.ts    → Message.ts
- profile_views.entity.ts → ProfileView.ts
- notifications.entity.ts → Notification.ts
- blocks.entity.ts       → Block.ts
- reports.entity.ts     → Report.ts
- email_verifications.entity.ts → EmailVerification.ts
- user_tags.entity.ts   → UserTag.ts
```

For each:
1. Create new class file extending `Model`
2. Define `static tableName`
3. Define `static columns`
4. Add helper methods like `findById()`, `findByUserId()`, etc.

### ✅ Success Criteria

- [ ] All 12 entities are classes
- [ ] Each has `tableName` and `columns` static properties
- [ ] Each extends `Model`

---

## Step 11: Update initDB

### 📖 Concept to Read First

Review current `backend/database/index.ts`.

### 🎯 Exercise

Update `backend/database/index.ts`:

```typescript
import User from "./entities/User.js";
import Tags from "./entities/Tags.js";
import Profile from "./entities/Profile.js";
// ... import all entities as classes

export async function initDB() {
  // Wave 1 — no dependencies
  await Promise.all([
    User.define(),
    Tags.define()
  ])

  // Wave 2 — depend on users
  await Promise.all([
    Profile.define(),
    // ... all wave 2 entities
  ])

  // Wave 3 — depend on users AND tags
  await UserTag.define()
}
```

### ✅ Success Criteria

- [ ] `initDB()` uses class-based entities
- [ ] No string table names passed manually
- [ ] Works with existing wave system

---

## Step 12: Add More Query Builder Methods

### 📖 Concept to Read First

Research: **SQL JOINs** — INNER, LEFT, RIGHT.

### 🎯 Exercise

Add to `Model.ts`:

```typescript
// Add join methods to base Model

static join(type: JoinTypes, table: string, on: string) {
  // Add join to current query builder
}

static leftJoin(table: string, on: string) {
  return this.join("LEFT", table, on);
}

static innerJoin(table: string, on: string) {
  return this.join("INNER", table, on);
}

static orderBy(column: string, direction: "ASC" | "DESC" = "ASC") {
  // Add order by
}

static groupBy(...columns: string[]) {
  // Add group by
}
```

### ✅ Success Criteria

- [ ] Can call `User.select().join(...)`
- [ ] Supports all join types
- [ ] Order by works with ASC/DESC

---

## 🎉 Final Result

After completing all exercises, your database layer will support:

```typescript
// Define tables
await User.define();
await Profile.define();

// Query with chaining
const users = await User
  .select({ columns: ["id", "email", "username"] })
  .where("is_verified = true")
  .orderBy("created_at", "DESC")
  .limit(20)
  .execute();

// Custom finders
const user = await User.findById(1);
const user = await User.findByEmail("test@test.com");
```

---

## 📚 Quick Reference

| Concept | Exercise |
|---------|----------|
| Static methods | Step 1-2 |
| Class inheritance | Step 3 |
| Method chaining | Step 4-5 |
| Abstract classes | Step 8 |
| Real-world refactor | Step 7-12 |

---

## 🆘 If Stuck

- **Step 1-2 stuck?** → Read MDN docs on "static"
- **Step 3 stuck?** → Research "super() in JavaScript"
- **Step 4 stuck?** → Remember: `return this`
- **Step 8 stuck?** → What is an abstract class in TypeScript?
