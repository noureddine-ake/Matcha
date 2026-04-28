# Query Builder Build() Method Exercises

Focus: Creating a robust `build()` method that generates valid SQL for all CRUD operations with proper typing and SQL order enforcement.

---

## 📊 Current Architecture Analysis

### Your Existing Types (select_types.ts)

```typescript
// Current - INCOMPLETE and WRONG ORDER
type OptionsTypes = {
    columns: string[];
    joins?: JoinOptions[];
    where?: string;           // Raw string - dangerous!
    groupBy?: GroupByType;     // Empty object {} - useless!
    having?: HavingType;      // Empty object {} - useless!
    orderBy?: OrderByType;    // Empty object {} - useless!
    limit?: Number;
    offset?: number;
}
```

**Problems:**
1. WHERE/HAVING/ORDER BY are empty objects `{}` - no type safety
2. No INSERT type
3. No UPDATE type  
4. No type to store VALUES for parameterized queries
5. No SQL order enforcement
6. Using raw strings for WHERE is SQL injection risk

---

## 🎯 Architecture Schema

### Query Builder Internal State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         QueryBuilder State                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  query: Query = {                                                           │
│    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',  ◄── Query type        │
│                                                                             │
│    // SELECT/INSERT/UPDATE/DELETE specific                                  │
│    table: string,                  ◄── Target table                         │
│    columns: string[],              ◄── columns for SELECT/INSERT            │
│                                                                             │
│    // INSERT/UPDATE specific                                                │
│    values: Record<string, any>,   ◄── { col: value } for INSERT/UPDATE    │
│    returning: string[],            ◄── RETURNING columns                   │
│                                                                             │
│    // JOINs                                                                 │
│    joins: JoinClause[],           ◄── [{ type, table, on }]                │
│                                                                             │
│    // WHERE/HAVING                                                           │
│    where: WhereClause,            ◄── Complex WHERE builder                │
│    having: WhereClause,           ◄── HAVING clause                       │
│                                                                             │
│    // GROUP BY                                                              │
│    groupBy: string[],             ◄── GROUP BY columns                     │
│                                                                             │
│    // ORDER & Pagination                                                    │
│    orderBy: OrderByClause[],      ◄── [{ column, direction }]             │
│    limit: number | null,          ◄── LIMIT                                │
│    offset: number | null,         ◄── OFFSET                               │
│                                                                             │
│    // CTEs                                                                  │
│    ctes: CTEClause[],             ◄── [{ name, query }]                    │
│  }                                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Methods that MODIFY state                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  .select(columns[])  ──▶ query.type = 'SELECT', query.columns = columns    │
│  .insert(table, data)  ──▶ query.type = 'INSERT', query.table, query.values│
│  .update(table, data) ──▶ query.type = 'UPDATE', query.table, query.values│
│  .delete(table)  ──▶ query.type = 'DELETE', query.table                     │
│                                                                             │
│  .from(table)  ──▶ query.table = table                                     │
│  .values(data)  ──▶ query.values = data                                     │
│  .returning(columns)  ──▶ query.returning = columns                       │
│                                                                             │
│  .join(type, table, on)  ──▶ query.joins.push({type, table, on})          │
│  .leftJoin(table, on)  ──▶ query.joins.push({type: 'LEFT', table, on})    │
│                                                                             │
│  .where(field, value)  ──▶ query.where.add(field, value)                   │
│  .whereAnd(conditions)  ──▶ query.where.addAnd(conditions)                 │
│  .whereOr(conditions)  ──▶ query.where.addOr(conditions)                   │
│  .whereIn(field, values)  ──▶ query.where.addIn(field, values)             │
│  .whereExists(subquery)  ──▶ query.where.addExists(subquery)               │
│  .whereNull(field)  ──▶ query.where.addNull(field)                          │
│                                                                             │
│  .groupBy(columns)  ──▶ query.groupBy = columns                           │
│  .having(condition)  ──▶ query.having.add(condition)                        │
│                                                                             │
│  .orderBy(column, direction)  ──▶ query.orderBy.push({column, direction}) │
│  .limit(n)  ──▶ query.limit = n                                             │
│  .offset(n)  ──▶ query.offset = n                                           │
│                                                                             │
│  .cte(name, query)  ──▶ query.ctes.push({name, query})                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Methods that READ state                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  .build()  ──▶ Reads query state, builds SQL string + returns params        │
│                                                                             │
│  Output: {                                                                  │
│    sql: string,           ◄── "SELECT id, email FROM users WHERE id = $1"  │
│    params: any[],         ◄── [1]                                           │
│    types: string[]        ◄── ['INT', 'VARCHAR'] for pg types              │
│  }                                                                           │
│                                                                             │
│  .toString()  ──▶ Just returns sql string                                   │
│  .toParams()  ──▶ Just returns params array                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 SQL Order Enforcement (Critical!)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CORRECT SQL ORDER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. WITH (CTEs)           ──▶ Must be FIRST                                  │
│  2. SELECT               ──▶ After WITH                                    │
│  3. FROM                 ──▶ After SELECT                                   │
│  4. JOIN                 ──▶ After FROM                                     │
│  5. WHERE                ──▶ After JOIN                                     │
│  6. GROUP BY             ──▶ After WHERE                                    │
│  7. HAVING               ──▶ After GROUP BY                                 │
│  8. ORDER BY             ──▶ After HAVING                                   │
│  9. LIMIT                ──▶ After ORDER BY                                 │
│ 10. OFFSET               ──▶ After LIMIT                                   │
│                                                                             │
│  INSERT order:  INSERT INTO → (columns) → VALUES → RETURNING              │
│  UPDATE order:  UPDATE → SET → WHERE → RETURNING                           │
│  DELETE order:  DELETE FROM → WHERE                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step BUILD-1: Define Complete Query Types

### 📖 Concepts to Read

- TypeScript discriminated unions
- TypeScript generic types
- PostgreSQL parameterized queries

### 🎯 Exercise

Create `backend/database/exercises/build/types.ts`:

```typescript
// ============================================================
// STEP 1: Define all query type variants
// ============================================================

// ----------------------
// WHERE Clause Builder
// ----------------------
export type WhereCondition = 
  | { type: 'equals'; field: string; value: any }
  | { type: 'in'; field: string; values: any[] }
  | { type: 'like'; field: string; value: string }
  | { type: 'null'; field: string; notNull: boolean }
  | { type: 'exists'; subquery: string; negate: boolean }
  | { type: 'and'; conditions: WhereCondition[] }
  | { type: 'or'; conditions: WhereCondition[] }
  | { type: 'raw'; sql: string };

export class WhereBuilder {
  private conditions: WhereCondition[] = [];
  
  equals(field: string, value: any): this {
    this.conditions.push({ type: 'equals', field, value });
    return this;
  }
  
  in(field: string, values: any[]): this {
    this.conditions.push({ type: 'in', field, values });
    return this;
  }
  
  and(conditions: WhereCondition[]): this {
    this.conditions.push({ type: 'and', conditions });
    return this;
  }
  
  or(conditions: WhereCondition[]): this {
    this.conditions.push({ type: 'or', conditions });
    return this;
  }
  
  exists(subquery: string, negate = false): this {
    this.conditions.push({ type: 'exists', subquery, negate });
    return this;
  }
  
  null(field: string, notNull = false): this {
    this.conditions.push({ type: 'null', field, notNull });
    return this;
  }
  
  raw(sql: string): this {
    this.conditions.push({ type: 'raw', sql });
    return this;
  }
  
  build(): WhereCondition[] {
    return this.conditions;
  }
  
  isEmpty(): boolean {
    return this.conditions.length === 0;
  }
}

// ----------------------
// JOIN Clause
// ----------------------
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS';

export type JoinClause = {
  type: JoinType;
  table: string;
  on: string;
};

// ----------------------
// ORDER BY Clause
// ----------------------
export type OrderByClause = {
  column: string;
  direction: 'ASC' | 'DESC';
};

// ----------------------
// CTE Clause
// ----------------------
export type CTEClause = {
  name: string;
  query: string;
};

// ----------------------
// Main Query Type (DISCRIMINATED UNION)
// ----------------------
export type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

export type BaseQuery = {
  table: string;
  ctes?: CTEClause[];
  where?: WhereBuilder;
  returning?: string[];
};

export type SelectQuery = BaseQuery & {
  type: 'SELECT';
  columns: string[];
  joins?: JoinClause[];
  groupBy?: string[];
  having?: WhereBuilder;
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
};

export type InsertQuery = BaseQuery & {
  type: 'INSERT';
  columns: string[];
  values: any[][];
};

export type UpdateQuery = BaseQuery & {
  type: 'UPDATE';
  set: Record<string, any>;
};

export type DeleteQuery = BaseQuery & {
  type: 'DELETE';
};

export type Query = SelectQuery | InsertQuery | UpdateQuery | DeleteQuery;

// ----------------------
// Build Output
// ----------------------
export type BuildResult = {
  sql: string;
  params: any[];
  paramTypes?: string[];
};
```

### ✅ Success Criteria

- [ ] `WhereBuilder` can chain multiple conditions
- [ ] All Query types (SELECT, INSERT, UPDATE, DELETE) defined
- [ ] Discriminated union works (TypeScript narrows correctly)
- [ ] `BuildResult` has sql + params

---

## Step BUILD-2: Create QueryBuilder Class

### 📖 Concepts to Read

- Class constructor
- Method chaining with `this`
- Array push patterns

### 🎯 Exercise

Create `backend/database/exercises/build/querybuilder.ts`:

```typescript
import { 
  Query, 
  SelectQuery, 
  InsertQuery, 
  UpdateQuery, 
  DeleteQuery,
  WhereBuilder,
  JoinClause,
  OrderByClause,
  CTEClause,
  BuildResult,
  QueryType
} from './types.js';

class QueryBuilder {
  // Internal state
  private query: Query | null = null;
  private whereBuilder: WhereBuilder;
  private havingBuilder: WhereBuilder;
  
  constructor() {
    this.whereBuilder = new WhereBuilder();
    this.havingBuilder = new WhereBuilder();
  }
  
  // ===================
  // SELECT methods
  // ===================
  select(columns: string[]): this {
    this.query = {
      type: 'SELECT',
      table: '',
      columns
    };
    return this;
  }
  
  // ===================
  // INSERT methods
  // ===================
  insert(table: string, data: Record<string, any>): this {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    this.query = {
      type: 'INSERT',
      table,
      columns,
      values: [values]
    };
    return this;
  }
  
  insertMany(table: string, data: Record<string, any>[]): this {
    if (data.length === 0) return this;
    const columns = Object.keys(data[0]);
    const values = data.map(row => Object.values(row));
    
    this.query = {
      type: 'INSERT',
      table,
      columns,
      values
    };
    return this;
  }
  
  // ===================
  // UPDATE methods
  // ===================
  update(table: string, data: Record<string, any>): this {
    this.query = {
      type: 'UPDATE',
      table,
      set: data
    };
    return this;
  }
  
  // ===================
  // DELETE methods
  // ===================
  delete(table: string): this {
    this.query = {
      type: 'DELETE',
      table
    };
    return this;
  }
  
  // ===================
  // Common methods
  // ===================
  from(table: string): this {
    if (this.query) {
      this.query.table = table;
    }
    return this;
  }
  
  values(data: Record<string, any>): this {
    if (this.query?.type === 'INSERT') {
      this.query.values.push(Object.values(data));
    }
    return this;
  }
  
  returning(columns: string[]): this {
    if (this.query) {
      this.query.returning = columns;
    }
    return this;
  }
  
  // ===================
  // JOIN methods
  // ===================
  join(type: 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS', table: string, on: string): this {
    if (this.query && this.query.type === 'SELECT') {
      if (!this.query.joins) {
        this.query.joins = [];
      }
      this.query.joins.push({ type, table, on });
    }
    return this;
  }
  
  innerJoin(table: string, on: string): this {
    return this.join('INNER', table, on);
  }
  
  leftJoin(table: string, on: string): this {
    return this.join('LEFT', table, on);
  }
  
  // ===================
  // WHERE methods
  // ===================
  where(field: string, value: any): this {
    this.whereBuilder.equals(field, value);
    return this;
  }
  
  whereAnd(conditions: Record<string, any>): this {
    const whereConds = Object.entries(conditions).map(([field, value]) => ({
      type: 'equals' as const,
      field,
      value
    }));
    this.whereBuilder.and(whereConds);
    return this;
  }
  
  whereIn(field: string, values: any[]): this {
    this.whereBuilder.in(field, values);
    return this;
  }
  
  whereNull(field: string, notNull = false): this {
    this.whereBuilder.null(field, notNull);
    return this;
  }
  
  whereExists(subquery: string, negate = false): this {
    this.whereBuilder.exists(subquery, negate);
    return this;
  }
  
  // ===================
  // GROUP BY & HAVING
  // ===================
  groupBy(...columns: string[]): this {
    if (this.query && this.query.type === 'SELECT') {
      this.query.groupBy = columns;
    }
    return this;
  }
  
  having(field: string, value: any): this {
    this.havingBuilder.equals(field, value);
    return this;
  }
  
  // ===================
  // ORDER & Pagination
  // ===================
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    if (this.query && this.query.type === 'SELECT') {
      if (!this.query.orderBy) {
        this.query.orderBy = [];
      }
      this.query.orderBy.push({ column, direction });
    }
    return this;
  }
  
  limit(n: number): this {
    if (this.query && this.query.type === 'SELECT') {
      this.query.limit = n;
    }
    return this;
  }
  
  offset(n: number): this {
    if (this.query && this.query.type === 'SELECT') {
      this.query.offset = n;
    }
    return this;
  }
  
  // ===================
  // CTE methods
  // ===================
  with(name: string, query: string): this {
    if (this.query) {
      if (!this.query.ctes) {
        this.query.ctes = [];
      }
      this.query.ctes.push({ name, query });
    }
    return this;
  }
  
  // ===================
  // BUILD method (KEY!)
  // ===================
  build(): BuildResult {
    if (!this.query) {
      throw new Error('No query defined. Call select(), insert(), update(), or delete() first.');
    }
    
    switch (this.query.type) {
      case 'SELECT':
        return this.buildSelect();
      case 'INSERT':
        return this.buildInsert();
      case 'UPDATE':
        return this.buildUpdate();
      case 'DELETE':
        return this.buildDelete();
      default:
        throw new Error('Unknown query type');
    }
  }
  
  // Private build methods
  private buildSelect(): BuildResult {
    const q = this.query as SelectQuery;
    const parts: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    // 1. WITH (CTEs)
    if (q.ctes && q.ctes.length > 0) {
      const cteStrings = q.ctes.map(cte => {
        return `${cte.name} AS (${cte.query})`;
      });
      parts.push(`WITH ${cteStrings.join(', ')}`);
    }
    
    // 2. SELECT
    parts.push(`SELECT ${q.columns.join(', ')}`);
    
    // 3. FROM
    if (q.table) {
      parts.push(`FROM ${q.table}`);
    }
    
    // 4. JOINs
    if (q.joins && q.joins.length > 0) {
      for (const join of q.joins) {
        parts.push(`${join.type} JOIN ${join.table} ON ${join.on}`);
      }
    }
    
    // 5. WHERE
    if (!this.whereBuilder.isEmpty()) {
      const whereSql = this.buildWhereClause(this.whereBuilder, params, paramIndex);
      if (whereSql) {
        parts.push(`WHERE ${whereSql}`);
        paramIndex = params.length + 1;
      }
    }
    
    // 6. GROUP BY
    if (q.groupBy && q.groupBy.length > 0) {
      parts.push(`GROUP BY ${q.groupBy.join(', ')}`);
    }
    
    // 7. HAVING
    if (!this.havingBuilder.isEmpty()) {
      const havingSql = this.buildWhereClause(this.havingBuilder, params, paramIndex);
      if (havingSql) {
        parts.push(`HAVING ${havingSql}`);
        paramIndex = params.length + 1;
      }
    }
    
    // 8. ORDER BY
    if (q.orderBy && q.orderBy.length > 0) {
      const orderStrings = q.orderBy.map(o => `${o.column} ${o.direction}`);
      parts.push(`ORDER BY ${orderStrings.join(', ')}`);
    }

    // 9. LIMIT
    if (q.limit !== undefined) {
      parts.push(`LIMIT ${q.limit}`);
    }

    // 10. OFFSET
    if (q.offset !== undefined) {
      parts.push(`OFFSET ${q.offset}`);
    }
    
    // RETURNING
    if (q.returning && q.returning.length > 0) {
      parts.push(`RETURNING ${q.returning.join(', ')}`);
    }
    
    return {
      sql: parts.join('\n'),
      params
    };
  }
  
  private buildInsert(): BuildResult {
    const q = this.query as InsertQuery;
    const parts: string[] = [];
    const params: any[] = [];
    
    // WITH (CTEs) - not common for INSERT but supported
    if (q.ctes && q.ctes.length > 0) {
      const cteStrings = q.ctes.map(cte => `${cte.name} AS (${cte.query})`);
      parts.push(`WITH ${cteStrings.join(', ')}`);
    }
    
    // INSERT INTO
    parts.push(`INSERT INTO ${q.table} (${q.columns.join(', ')})`);
    
    // VALUES
    const valuePlaceholders = q.values.map((_, rowIdx) => {
      const placeholders = q.columns.map((_, colIdx) => {
        return `$${rowIdx * q.columns.length + colIdx + 1}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    parts.push(`VALUES ${valuePlaceholders.join(', ')}`);
    
    // Flatten values for params
    for (const row of q.values) {
      params.push(...row);
    }
    
    // RETURNING
    if (q.returning && q.returning.length > 0) {
      parts.push(`RETURNING ${q.returning.join(', ')}`);
    }
    
    return {
      sql: parts.join('\n'),
      params
    };
  }
  
  private buildUpdate(): BuildResult {
    const q = this.query as UpdateQuery;
    const parts: string[] = [];
    const params: any[] = [];
    
    // UPDATE
    parts.push(`UPDATE ${q.table}`);
    
    // SET
    const setParts = Object.entries(q.set).map(([key], idx) => {
      params.push(Object.values(q.set)[idx]);
      return `${key} = $${params.length}`;
    });
    parts.push(`SET ${setParts.join(', ')}`);
    
    // WHERE
    if (!this.whereBuilder.isEmpty()) {
      const whereSql = this.buildWhereClause(this.whereBuilder, params, params.length + 1);
      if (whereSql) {
        parts.push(`WHERE ${whereSql}`);
      }
    }
    
    // RETURNING
    if (q.returning && q.returning.length > 0) {
      parts.push(`RETURNING ${q.returning.join(', ')}`);
    }
    
    return {
      sql: parts.join('\n'),
      params
    };
  }
  
  private buildDelete(): BuildResult {
    const q = this.query as DeleteQuery;
    const parts: string[] = [];
    const params: any[] = [];
    
    // DELETE FROM
    parts.push(`DELETE FROM ${q.table}`);
    
    // WHERE
    if (!this.whereBuilder.isEmpty()) {
      const whereSql = this.buildWhereClause(this.whereBuilder, params, params.length + 1);
      if (whereSql) {
        parts.push(`WHERE ${whereSql}`);
      }
    }
    
    // RETURNING
    if (q.returning && q.returning.length > 0) {
      parts.push(`RETURNING ${q.returning.join(', ')}`);
    }
    
    return {
      sql: parts.join('\n'),
      params
    };
  }
  
  // Helper to build WHERE clause from WhereBuilder
  private buildWhereClause(builder: WhereBuilder, params: any[], startIndex: number): string {
    const conditions = builder.build();
    if (conditions.length === 0) return '';
    
    return conditions.map(cond => {
      switch (cond.type) {
        case 'equals':
          params.push(cond.value);
          return `${cond.field} = $${params.length}`;
        case 'in':
          const placeholders = cond.values.map((_, idx) => {
            params.push(cond.values[idx]);
            return `$${params.length}`;
          });
          return `${cond.field} IN (${placeholders.join(', ')})`;
        case 'null':
          return cond.notNull 
            ? `${cond.field} IS NOT NULL` 
            : `${cond.field} IS NULL`;
        case 'exists':
          return cond.negate 
            ? `NOT EXISTS (${cond.subquery})` 
            : `EXISTS (${cond.subquery})`;
        case 'raw':
          return cond.sql;
        default:
          return '';
      }
    }).join(' AND ');
  }
  
  // Helper methods
  toString(): string {
    return this.build().sql;
  }
  
  toParams(): any[] {
    return this.build().params;
  }
}

export default QueryBuilder;
```

### ✅ Success Criteria

- [ ] Can build SELECT query
- [ ] Can build INSERT query  
- [ ] Can build UPDATE query
- [ ] Can build DELETE query
- [ ] WHERE clause builds correctly with params
- [ ] ORDER BY/LIMIT/OFFSET work
- [ ] JOINs work in correct order

---

## Step BUILD-3: Test All CRUD Operations

### 📖 Concepts to Read

- SQL parameterized queries
- pg-format for identifier escaping

### 🎯 Exercise

Create `backend/database/exercises/build/test.ts`:

```typescript
import QueryBuilder from './querybuilder.js';

// ===================
// TEST 1: Simple SELECT
// ===================
const test1 = new QueryBuilder()
  .select(['id', 'email', 'username'])
  .from('users')
  .where('id', 1)
  .build();

console.log('=== TEST 1: Simple SELECT ===');
console.log(test1.sql);
console.log('Params:', test1.params);
/*
Expected:
SELECT id, email, username
FROM users
WHERE id = $1
Params: [1]
*/

// ===================
// TEST 2: SELECT with JOIN
// ===================
const test2 = new QueryBuilder()
  .select(['u.id', 'u.username', 'p.gender', 'p.fame_rating'])
  .from('users u')
  .innerJoin('profiles p', 'u.id = p.user_id')
  .where('u.is_verified', true)
  .orderBy('p.fame_rating', 'DESC')
  .limit(20)
  .build();

console.log('\n=== TEST 2: SELECT with JOIN ===');
console.log(test2.sql);
console.log('Params:', test2.params);

// ===================
// TEST 3: INSERT
// ===================
const test3 = new QueryBuilder()
  .insert('users', {
    email: 'test@test.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    password_hash: 'hashedpassword'
  })
  .returning(['id', 'email'])
  .build();

console.log('\n=== TEST 3: INSERT ===');
console.log(test3.sql);
console.log('Params:', test3.params);
/*
Expected:
INSERT INTO users (email, username, first_name, last_name, password_hash)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, email
Params: ['test@test.com', 'testuser', 'Test', 'User', 'hashedpassword']
*/

// ===================
// TEST 4: UPDATE
// ===================
const test4 = new QueryBuilder()
  .update('users', {
    email: 'newemail@test.com',
    username: 'newusername'
  })
  .where('id', 1)
  .returning(['id', 'email', 'username'])
  .build();

console.log('\n=== TEST 4: UPDATE ===');
console.log(test4.sql);
console.log('Params:', test4.params);

// ===================
// TEST 5: DELETE
// ===================
const test5 = new QueryBuilder()
  .delete('users')
  .where('id', 1)
  .build();

console.log('\n=== TEST 5: DELETE ===');
console.log(test5.sql);
console.log('Params:', test5.params);

// ===================
// TEST 6: WHERE IN
// ===================
const test6 = new QueryBuilder()
  .select(['*'])
  .from('users')
  .whereIn('id', [1, 2, 3, 4, 5])
  .build();

console.log('\n=== TEST 6: WHERE IN ===');
console.log(test6.sql);
console.log('Params:', test6.params);

// ===================
// TEST 7: Complex WHERE (chatModel pattern)
// ===================
const test7 = new QueryBuilder()
  .select(['*'])
  .from('messages')
  .whereRaw('(sender_user_id = $1 AND receiver_user_id = $2) OR (sender_user_id = $3 AND receiver_user_id = $4)')
  .orderBy('sent_at', 'DESC')
  .limit(20)
  .build();

console.log('\n=== TEST 7: Complex WHERE ===');
console.log(test7.sql);
console.log('Params:', test7.params);

// ===================
// TEST 8: INSERT multiple rows
// ===================
const test8 = new QueryBuilder()
  .insertMany('user_tags', [
    { user_id: 1, tag_id: 1 },
    { user_id: 1, tag_id: 2 },
    { user_id: 1, tag_id: 3 }
  ])
  .build();

console.log('\n=== TEST 8: INSERT Many ===');
console.log(test8.sql);
console.log('Params:', test8.params);
```

### ✅ Success Criteria

- [ ] All 8 tests pass
- [ ] Params array correctly populated
- [ ] SQL syntax valid

---

## Step BUILD-4: Add pg-format Integration

### 📖 Concepts to Read

- pg-format for identifier escaping
- Why we need format for table/column names

### 🎯 Exercise

Update `querybuilder.ts` to use pg-format:

```typescript
import format from 'pg-format';

// In buildSelect(), change:
parts.push(`FROM ${q.table}`);
// To:
parts.push(`FROM ${format.ident(q.table)}`);

// In buildInsert(), change:
parts.push(`INSERT INTO ${q.table} (${q.columns.join(', ')})`);
// To:
parts.push(`INSERT INTO ${format.ident(q.table)} (${q.columns.map(format.ident).join(', ')})`);

// Similar for UPDATE and DELETE
```

### ✅ Success Criteria

- [ ] Table names properly escaped
- [ ] Column names properly escaped
- [ ] No SQL injection possible via table/column names

---

## Step BUILD-5: Connect to ORM

### 📖 Concepts to Read

- How to integrate QueryBuilder with existing ORM

### 🎯 Exercise

Update your `backend/database/orm.ts`:

```typescript
import QueryBuilder from './exercises/build/querybuilder.js';

class ORM {
  // ... existing code ...
  
  // NEW: Query builder method
  query(): QueryBuilder {
    return new QueryBuilder();
  }
  
  // Execute a QueryBuilder
  async execute(builder: QueryBuilder) {
    const { sql, params } = builder.build();
    const result = await this.connection.query(sql, params);
    return result;
  }
}

export default new ORM();
```

### ✅ Success Criteria

- [ ] `orm.query()` returns new QueryBuilder
- [ ] `orm.execute(builder)` runs the query
- [ ] Results returned from database

---

## 🎉 Final Usage Example

```typescript
import orm from '../orm.js';

// SELECT with JOIN
const users = await orm.execute(
  new QueryBuilder()
    .select(['u.id', 'u.username', 'p.gender', 'p.fame_rating'])
    .from('users u')
    .innerJoin('profiles p', 'u.id = p.user_id')
    .where('u.is_verified', true)
    .orderBy('p.fame_rating', 'DESC')
    .limit(20)
);

// INSERT
await orm.execute(
  new QueryBuilder()
    .insert('users', { email, username, password_hash })
    .returning(['id', 'email'])
);

// UPDATE
await orm.execute(
  new QueryBuilder()
    .update('users', { email: newEmail })
    .where('id', userId)
    .returning(['*'])
);

// DELETE
await orm.execute(
  new QueryBuilder()
    .delete('users')
    .where('id', userId)
);
```

---

## 📚 Quick Reference

| Method | Sets | Build Order |
|--------|------|-------------|
| `.select()` | query.type, query.columns | 1 |
| `.from()` | query.table | 3 |
| `.join()` | query.joins | 4 |
| `.where()` | query.where | 5 |
| `.groupBy()` | query.groupBy | 6 |
| `.having()` | query.having | 7 |
| `.orderBy()` | query.orderBy | 8 |
| `.limit()` | query.limit | 9 |
| `.offset()` | query.offset | 10 |
| `.returning()` | query.returning | 11 |
| `.build()` | (reads all) | builds SQL |

---

## ⚠️ Common Mistakes to Avoid

1. **Wrong SQL order** → WHERE before FROM → syntax error
2. **Not escaping identifiers** → SQL injection risk
3. **Params not matching** → Wrong number of `$1, $2` → query fails
4. **WHERE with array not handled** → Use `whereIn()` not multiple `.where()`
5. **Forgetting RETURNING** → Can't get inserted ID
