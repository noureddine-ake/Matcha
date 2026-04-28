# Complete ORM Query Builder Exercises

Based on your actual SQL queries in `backend/src/models/`. This covers every pattern you need to support.

---

## 📊 SQL Patterns Found in Your Code

| Category | Count | Examples |
|----------|-------|----------|
| Basic CRUD | 4 | INSERT, SELECT, UPDATE, DELETE |
| WHERE variants | 7 | simple, AND/OR, NOT IN, EXISTS, DISTINCT ON |
| JOINs | 3 | INNER, LEFT, CROSS |
| Aggregates | 5 | COUNT, SUM, JSON_agg, COALESCE |
| Complex queries | 8 | CTEs, Haversine, pagination, ORDER BY |
| Advanced SQL | 4 | EXTRACT, INTERVAL, array_agg, FILTER |

---

## Step ORM-1: Basic CRUD Operations

### 📖 Concepts to Read

- SQL INSERT with RETURNING
- SQL SELECT WHERE
- SQL UPDATE with SET
- SQL DELETE

### 🎯 Exercises

Create `backend/database/exercises/orm/orm1-crud.ts`:

```typescript
// Implement these methods in your QueryBuilder:

// 1. INSERT with values
insert(table: string, data: Record<string, any>): QueryBuilder

// 2. SELECT with WHERE (simple equality)
where(field: string, value: any): QueryBuilder

// 3. UPDATE with SET
set(data: Record<string, any>): QueryBuilder

// 4. DELETE
delete(table: string): QueryBuilder

// Examples from your code:
/*
INSERT INTO users (email, username, first_name, last_name, password_hash)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

SELECT * FROM users WHERE id=$1

UPDATE users SET email=$1, username=$2 WHERE id=$3 RETURNING *

DELETE FROM users WHERE id=$1
*/
```

### ✅ Success Criteria

- [ ] Can generate INSERT with multiple columns
- [ ] Can generate SELECT with WHERE clause
- [ ] Can generate UPDATE with SET
- [ ] Can generate DELETE

---

## Step ORM-2: WHERE Clause Variants

### 📖 Concepts to Read

- SQL AND/OR operators
- SQL IN and NOT IN
- SQL EXISTS and NOT EXISTS
- SQL IS NULL and IS NOT NULL

### 🎯 Exercises

Create `backend/database/exercises/orm/orm2-where.ts`:

```typescript
// Implement complex WHERE patterns from your code:

// 1. AND multiple conditions
whereAnd(conditions: Record<string, any>): QueryBuilder
// Output: WHERE field1 = $1 AND field2 = $2

// 2. OR conditions (from chatModel)
whereOr(conditions: string[]): QueryBuilder
// Output: WHERE (a = $1 AND b = $2) OR (a = $3 AND b = $4)

// 3. IN clause (from suggestionsModal)
whereIn(field: string, values: any[]): QueryBuilder
// Output: WHERE id NOT IN ($1, $2, $3)

// 4. EXISTS / NOT EXISTS subquery
whereExists(subquery: string, negate?: boolean): QueryBuilder
// Output: WHERE NOT EXISTS (SELECT 1 FROM blocks WHERE ...)

// 5. IS NULL / IS NOT NULL
whereNull(field: string, notNull?: boolean): QueryBuilder
// Output: WHERE p.gender IS NOT NULL

// Examples from your code:
/*
WHERE (sender_user_id = $1 AND receiver_user_id = $2) 
   OR (sender_user_id = $2 AND receiver_user_id = $1)

WHERE u.id NOT IN (SELECT liked_user_id FROM likes WHERE liker_user_id = $1)

WHERE NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_user_id = $1 AND blocked_user_id = u.id)

WHERE p.gender IS NOT NULL
*/
```

### ✅ Success Criteria

- [ ] AND multiple conditions
- [ ] OR with multiple conditions
- [ ] IN / NOT IN subqueries
- [ ] EXISTS / NOT EXISTS
- [ ] NULL / NOT NULL checks

---

## Step ORM-3: JOIN Operations

### 📖 Concepts to Read

- SQL INNER JOIN
- SQL LEFT JOIN
- SQL CROSS JOIN
- Multiple JOINs in one query

### 🎯 Exercises

Create `backend/database/exercises/orm/orm3-joins.ts`:

```typescript
// Implement JOIN methods from your code:

// 1. INNER JOIN
innerJoin(table: string, on: string): QueryBuilder

// 2. LEFT JOIN
leftJoin(table: string, on: string): QueryBuilder

// 3. Multiple JOINs (chainable)
join(type: 'INNER' | 'LEFT' | 'RIGHT', table: string, on: string): QueryBuilder

// Examples from your code:
/*
-- From notificationModel.ts
JOIN users u ON u.id = n.from_user_id

-- From matchModel.ts  
INNER JOIN profiles p ON u.id = p.user_id

-- From matchModel.ts with multiple JOINs
LEFT JOIN photos ph ON ph.user_id = u.id
LEFT JOIN user_tags ut ON ut.user_id = u.id
LEFT JOIN tags t ON t.id = ut.tag_id

-- From matchModel.ts (WITH clause + CROSS JOIN)
CROSS JOIN current_user_location curr
*/
```

### ✅ Success Criteria

- [ ] INNER JOIN works
- [ ] LEFT JOIN works
- [ ] Can chain multiple JOINs
- [ ] Generates correct SQL

---

## Step ORM-4: Aggregates and Grouping

### 📖 Concepts to Read

- SQL COUNT, SUM, AVG
- SQL GROUP BY
- SQL HAVING
- SQL DISTINCT

### 🎯 Exercises

Create `backend/database/exercises/orm/orm4-aggregates.ts`:

```typescript
// Implement aggregate functions from your code:

// 1. COUNT
count(column?: string): QueryBuilder
// Output: SELECT COUNT(*) or SELECT COUNT(column)

// 2. SUM, AVG, MAX, MIN
aggregate(type: 'SUM' | 'AVG' | 'MAX' | 'MIN', column: string): QueryBuilder

// 3. GROUP BY
groupBy(...columns: string[]): QueryBuilder

// 4. HAVING with condition
having(condition: string): QueryBuilder

// 5. DISTINCT
distinct(column?: string): QueryBuilder

// Examples from your code:
/*
SELECT COUNT(*)::int AS total_likes FROM likes WHERE liked_user_id = $1

SELECT COUNT(*) FROM messages WHERE ...

GROUP BY u.id, u.username, p.gender, p.biography ...

HAVING COUNT(*) > 0

SELECT DISTINCT ON (pv.viewer_user_id) ...
*/
```

### ✅ Success Criteria

- [ ] COUNT works
- [ ] GROUP BY works
- [ ] HAVING works
- [ ] DISTINCT works

---

## Step ORM-5: JSON and Array Operations

### 📖 Concepts to Read

- SQL JSON_agg
- SQL json_build_object
- SQL COALESCE
- SQL FILTER (for aggregates)

### 🎯 Exercises

Create `backend/database/exercises/orm/orm5-json.ts`:

```typescript
// Implement JSON/array operations from matchModel.ts:

// 1. JSON_agg for building arrays
jsonAgg(columns: Record<string, string>): QueryBuilder
// Output: json_agg(json_build_object('id', ph.id, 'photo_url', ph.photo_url))

// 2. COALESCE for null handling
coalesce(expression: string, defaultValue: string): QueryBuilder
// Output: COALESCE(json_agg(...), '[]')

// 3. Build JSON object
jsonBuildObject(mapping: Record<string, string>): string
// Output: json_build_object('id', ph.id, 'photo_url', ph.photo_url)

// Examples from your code:
/*
COALESCE(
  json_agg(
    DISTINCT jsonb_build_object(
      'id', ph.id,
      'photo_url', ph.photo_url,
      'is_profile_picture', ph.is_profile_picture
    )
  ) FILTER (WHERE ph.id IS NOT NULL),
  '[]'
) AS photos
*/
```

### ✅ Success Criteria

- [ ] Can generate JSON_agg
- [ ] Can generate json_build_object
- [ ] Can handle COALESCE
- [ ] Can use FILTER with aggregates

---

## Step ORM-6: Complex WHERE with Calculations

### 📖 Concepts to Read

- SQL mathematical operations
- SQL functions (acos, cos, radians, etc.)
- SQL CASE expressions

### 🎯 Exercises

Create `backend/database/exercises/orm/orm6-calculations.ts`:

```typescript
// Implement complex calculations from matchModel.ts (Haversine formula):

// 1. Raw SQL expression
raw(sql: string): QueryBuilder

// 2. Function calls
functionCall(name: string, ...args: string[]): string
// Output: EXTRACT(YEAR FROM AGE(p.birth_date))

// 3. Mathematical operations
math(expression: string): string
// Output: 6371 * acos(cos(radians(curr.latitude)) * cos(radians(p.latitude)) ...)

// Examples from your code:
/*
-- Distance calculation (Haversine)
ROUND(
  6371 * acos(
    cos(radians(curr.latitude)) * cos(radians(p.latitude)) * 
    cos(radians(p.longitude) - radians(curr.longitude)) + 
    sin(radians(curr.latitude)) * sin(radians(p.latitude))
  )
) as distance

-- Age calculation
EXTRACT(YEAR FROM AGE(p.birth_date)) as age

-- Dynamic filtering
${filters.genderFilter}
${filters.minAge ? `AND EXTRACT(YEAR FROM AGE(p.birth_date)) >= ${parseInt(filters.minAge)}` : ''}
*/
```

### ✅ Success Criteria

- [ ] Can insert raw SQL
- [ ] Can generate function calls (EXTRACT, AGE, etc.)
- [ ] Can handle mathematical expressions

---

## Step ORM-7: Common Table Expressions (CTEs)

### 📖 Concepts to Read

- SQL WITH clause
- SQL CTE (Common Table Expression)

### 🎯 Exercises

Create `backend/database/exercises/orm/orm7-cte.ts`:

```typescript
// Implement CTEs from matchModel.ts:

// 1. WITH clause (CTE)
with(name: string, query: string): QueryBuilder

// 2. Multiple CTEs
withMultiple(ctes: Record<string, string>): QueryBuilder

// Examples from your code:
/*
WITH current_user_location AS (
  SELECT latitude, longitude FROM profiles WHERE user_id = $1
),
current_user_tags AS (
  SELECT tag_id FROM user_tags WHERE user_id = $1
)
SELECT ... FROM users u
INNER JOIN profiles p ON u.id = p.user_id
CROSS JOIN current_user_location curr
*/
```

### ✅ Success Criteria

- [ ] Can create single CTE
- [ ] Can create multiple CTEs
- [ ] CTE properly references in main query

---

## Step ORM-8: Pagination and Ordering

### 📖 Concepts to Read

- SQL LIMIT
- SQL OFFSET
- SQL ORDER BY with ASC/DESC
- SQL cursor-based pagination

### 🎯 Exercises

Create `backend/database/exercises/orm/orm8-pagination.ts`:

```typescript
// Implement pagination from chatModel.ts:

// 1. LIMIT
limit(n: number): QueryBuilder

// 2. OFFSET
offset(n: number): QueryBuilder

// 3. ORDER BY
orderBy(column: string, direction?: 'ASC' | 'DESC'): QueryBuilder

// 4. Multiple ORDER BY columns
orderByMultiple(columns: string[]): QueryBuilder

// Examples from your code:
/*
ORDER BY sent_at DESC
LIMIT $3 OFFSET $4

ORDER BY p.fame_rating DESC

ORDER BY pv.viewer_user_id, pv.viewed_at DESC
*/
```

### ✅ Success Criteria

- [ ] LIMIT works
- [ ] OFFSET works
- [ ] ORDER BY works with ASC/DESC
- [ ] Multiple ORDER BY columns work

---

## Step ORM-9: Date and Time Operations

### 📖 Concepts to Read

- SQL INTERVAL
- SQL CURRENT_TIMESTAMP
- SQL NOW()

### 🎯 Exercises

Create `backend/database/exercises/orm/orm9-datetime.ts`:

```typescript
// Implement datetime operations from your code:

// 1. CURRENT_TIMESTAMP
currentTimestamp(): string

// 2. NOW()
now(): string

// 3. INTERVAL
interval(value: string): string
// Output: INTERVAL '24 hours'

// 4. Date arithmetic
dateAdd(column: string, interval: string): string
// Output: viewed_at > NOW() - INTERVAL '24 hours'

// Examples from your code:
/*
SET updated_at = CURRENT_TIMESTAMP

VALUES ($1, $2, $3, NOW(), false)

WHERE viewed_at > NOW() - INTERVAL '24 hours'
*/
```

### ✅ Success Criteria

- [ ] CURRENT_TIMESTAMP works
- [ ] NOW() works
- [ ] INTERVAL works
- [ ] Date arithmetic works

---

## Step ORM-10: Complete Query Builder

### 📖 Concepts to Read

Review all previous steps.

### 🎯 Exercise

Create a complete `QueryBuilder` class that supports ALL the above operations in a chainable way:

```typescript
// Final QueryBuilder should support:
class QueryBuilder {
  // CRUD
  insert(table: string, data: Record<string, any>): this
  select(columns: string[]): this
  update(table: string, data: Record<string, any>): this
  delete(table: string): this
  
  // WHERE
  where(field: string, value: any): this
  whereAnd(conditions: Record<string, any>): this
  whereOr(conditions: string[]): this
  whereIn(field: string, values: any[]): this
  whereExists(subquery: string, negate?: boolean): this
  whereNull(field: string, notNull?: boolean): this
  
  // JOINs
  join(type: 'INNER' | 'LEFT' | 'RIGHT', table: string, on: string): this
  innerJoin(table: string, on: string): this
  leftJoin(table: string, on: string): this
  
  // Aggregates
  count(column?: string): this
  aggregate(type: 'SUM' | 'AVG' | 'MAX' | 'MIN', column: string): this
  groupBy(...columns: string[]): this
  having(condition: string): this
  distinct(column?: string): this
  
  // Ordering & Pagination
  orderBy(column: string, direction?: 'ASC' | 'DESC'): this
  limit(n: number): this
  offset(n: number): this
  
  // Advanced
  cte(name: string, query: string): this
  raw(sql: string): this
  
  // Build
  build(): string
  execute(): Promise<any>
}

// Usage should be:
const query = new QueryBuilder()
  .select(['u.id', 'u.username', 'p.gender', 'p.fame_rating'])
  .from('users u')
  .innerJoin('profiles p', 'u.id = p.user_id')
  .where('u.is_verified = true')
  .whereNull('p.gender')
  .groupBy('u.id', 'p.gender', 'p.fame_rating')
  .orderBy('p.fame_rating', 'DESC')
  .limit(20)
  .offset(0)
  .build();
```

### ✅ Success Criteria

- [ ] All CRUD operations work
- [ ] All WHERE variants work
- [ ] All JOIN types work
- [ ] Aggregates and GROUP BY work
- [ ] Pagination works
- [ ] Builds valid SQL string

---

## 🎉 Final Result

After completing these exercises, your ORM will support every SQL pattern from your project:

```typescript
// Example: matchModel.ts searchSuggestions2
const suggestions = await new QueryBuilder()
  .cte('current_user_location', 'SELECT latitude, longitude FROM profiles WHERE user_id = $1')
  .select([...])
  
  .from('users u')
  .innerJoin('profiles p', 'u.id = p.user_id')
  .leftJoin('photos ph', 'ph.user_id = u.id')
  .leftJoin('user_tags ut', 'ut.user_id = u.id')
  .leftJoin('tags t', 't.id = ut.tag_id')
  .where('u.id != $1')
  .where('u.is_verified = TRUE')
  .whereNotNull('p.gender')
  .whereNotIn('u.id', blockedUserIds)
  .groupBy([...])
  .orderBy('distance', 'ASC')
  .limit(20)
  .offset(0)
  .execute();
```

---

## 📚 Quick Reference

| Step | Focus | Your Code Reference |
|------|-------|---------------------|
| ORM-1 | Basic CRUD | userModel.ts, profileModel.ts |
| ORM-2 | WHERE variants | chatModel.ts, suggestionsModal.ts |
| ORM-3 | JOINs | notificationModel.ts, matchModel.ts |
| ORM-4 | Aggregates | likesModel.ts, matchModel.ts |
| ORM-5 | JSON/Array | matchModel.ts |
| ORM-6 | Calculations | matchModel.ts (Haversine) |
| ORM-7 | CTEs | matchModel.ts |
| ORM-8 | Pagination | chatModel.ts |
| ORM-9 | DateTime | profileViewModel.ts |
| ORM-10 | Complete | All files |
