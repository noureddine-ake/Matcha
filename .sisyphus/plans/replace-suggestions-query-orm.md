# 🎯 Work Plan: Replace Raw SQL Suggestions Query with ORM Approach

**Objective:** Convert `searchSuggestions2()` raw SQL query to custom ORM with TypeScript business logic

**Files Involved:**
- Primary: `/backend/src/models/matchModel.ts`
- Modified: `/backend/src/controllers/matchingController.ts`
- Reference: `/backend/database/query_builder.ts`, `/backend/database/model.ts`

**Complexity:** High (requires understanding both ORM capabilities and business logic)

---

## 📋 Step-by-Step Exercise Plan

### **PHASE 1: Understanding Current Implementation** (15 min)

#### Step 1.1: Analyze Current Query Structure
**Goal:** Break down the complex SQL query into logical components

**What to do:**
1. Read the current `searchSuggestions2()` function in `/backend/src/models/matchModel.ts`
2. Identify 5 key parts:
   - **CTEs (Common Table Expressions):** current_user_location, current_user_tags
   - **Complex Calculations:** Haversine distance formula
   - **Subqueries:** common_tags, tags array, photos JSON, like status checks
   - **Filters:** is_verified, biography, profile picture, blocks, already_liked
   - **Sorting:** distance, fame, age, tags count

**Expected Output:**
```
Current Query Has:
1. CTE for user location (lat/long)
2. CTE for user's existing tags
3. Haversine distance formula (complex math)
4. 4 subqueries for:
   - Counting common tags
   - Aggregating tag names
   - Aggregating photos as JSON
   - Checking like/block status
5. 8+ WHERE filters
6. GROUP BY clause
7. Dynamic ORDER BY and pagination
```

#### Step 1.2: Map Query Components to ORM Equivalents
**Goal:** Understand which ORM methods to use for each part

**Exercise:**
Create a mapping table (in your head or on paper):

| SQL Component | ORM Equivalent | ORM Method | Complexity |
|---|---|---|---|
| SELECT columns | `.select()` | QueryBuilder | ✅ Easy |
| INNER JOIN profiles | `.join()` | QueryBuilder | ✅ Easy |
| CROSS JOIN location | `.join()` | QueryBuilder | ⚠️ May need Raw |
| WHERE conditions | `.where()` | QueryBuilder | ✅ Easy |
| Haversine formula | Raw SQL | `new Raw()` | 🔴 Hard |
| Subqueries | Raw SQL | `new Raw()` | 🔴 Hard |
| GROUP BY | `.groupBy()` | QueryBuilder | ✅ Easy |
| ORDER BY | `.orderBy()` | QueryBuilder | ✅ Easy |
| LIMIT/OFFSET | `.limit()/.offset()` | QueryBuilder | ✅ Easy |

---

### **PHASE 2: Design New ORM Function** (20 min)

#### Step 2.1: Plan Function Signature
**Goal:** Define what the new function will accept and return

**Exercise:** Decide on function structure:

```typescript
// Option A: One big ORM query (harder)
export const searchSuggestions2 = async (
  userId: number,
  filters: SuggestionFilters
): Promise<SuggestionResult[]> {
  // Build complex ORM query
}

// Option B: Hybrid approach (easier - recommended)
export const searchSuggestions2 = async (
  userId: number,
  filters: SuggestionFilters
): Promise<SuggestionResult[]> {
  // Use ORM for main query
  // Use Raw() for complex calculations
  // Use TypeScript for post-processing (filtering, sorting)
}
```

**Decision:** Use **Option B (Hybrid)** because:
- ORM handles table joins and basic filters
- Raw SQL handles Haversine distance calculation
- TypeScript handles complex sorting and filtering post-query

#### Step 2.2: Define Types
**Goal:** Create TypeScript interfaces for the new function

**Exercise:** Write types in `/backend/src/models/matchModel.ts`:

```typescript
interface SuggestionFilters {
  maxDistance: number;
  minAge?: number;
  maxAge?: number;
  minFame?: number;
  maxFame?: number;
  genderFilter: string;
  mutualPreferenceFilter: string;
  orderByClause: string;
}

interface SuggestionResult {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  gender: string;
  biography: string;
  fame_rating: number;
  city: string;
  country: string;
  is_online: boolean;
  last_seen: Date;
  latitude: number;
  longitude: number;
  age: number;
  distance: number;
  common_tags: number;
  tags: string[] | null;
  photos: Array<{id: number; photo_url: string; is_profile_picture: boolean}> | null;
  already_liked: boolean;
  they_liked_us: boolean;
}
```

---

### **PHASE 3: Implement Core ORM Query** (30 min)

#### Step 3.1: Get Current User Location
**Goal:** Fetch user's latitude and longitude as foundation

**Exercise:**

```typescript
// STEP 1: Get current user's profile with location
const currentUserProfile = await Profiles.select(['latitude', 'longitude'])
  .where('user_id', userId)
  .run();

if (!currentUserProfile.rowCount || !currentUserProfile.rows[0]) {
  throw new Error('User profile not found');
}

const { latitude: userLat, longitude: userLon } = currentUserProfile.rows[0];
```

**What to Learn:**
- How to chain `.where()` and `.run()`
- How to extract values from result
- Error handling for missing data

#### Step 3.2: Build Main Profile Query with Joins
**Goal:** Create ORM query that joins users, profiles, and gets basic data

**Exercise:**

```typescript
// STEP 2: Build main query with joins
const query = Users.select([
  'u.id',
  'u.username',
  'u.first_name',
  'u.last_name',
  'p.gender',
  'p.biography',
  'p.fame_rating',
  'p.city',
  'p.country',
  'p.is_online',
  'p.last_seen',
  'p.latitude',
  'p.longitude',
])
  .from('users u')
  .join('INNER', 'profiles p', 'u.id = p.user_id')
  .where('u.id', userId, 'not_equals')      // != $1
  .where('u.is_verified', true)             // = TRUE
  .where('p.gender', null, 'not_null')      // IS NOT NULL
  .where('p.sexual_preference', null, 'not_null')
  .where('p.latitude', null, 'not_null')
  .where('p.longitude', null, 'not_null');
  // ... continue adding WHERE filters
```

**What to Learn:**
- Aliasing tables in `.from()`
- `.join()` syntax
- Chaining multiple `.where()` calls
- Different where operators ('not_equals', 'not_null', etc.)

#### Step 3.3: Add Complex Distance Calculation
**Goal:** Use Raw SQL for Haversine formula

**Exercise:**

```typescript
// STEP 3: Add distance calculation using Raw SQL
const distanceFormula = new Raw(`
  ROUND(
    6371 * acos(
      cos(radians(${userLat})) * cos(radians(p.latitude)) * 
      cos(radians(p.longitude) - radians(${userLon})) + 
      sin(radians(${userLat})) * sin(radians(p.latitude))
    )
  ) as distance
`);

// Add distance calculation to SELECT
// (You may need to modify QueryBuilder to support custom select columns)
```

**What to Learn:**
- How to use `new Raw()` for complex SQL
- Injecting JavaScript values into SQL safely
- Why Haversine formula needs Raw SQL

#### Step 3.4: Add Exists Filters (No blocked, not already liked)
**Goal:** Add complex WHERE conditions for relationships

**Exercise:**

```typescript
// STEP 4: Add existence checks for blocks and likes
query
  .where('user_id', userId, 'not_exists_block_by_me')
  .where('user_id', userId, 'not_exists_block_by_them')
  .where('user_id', userId, 'not_exists_like_by_me');
  
// You may need to add these operators to WhereBuilder if they don't exist
```

**What to Learn:**
- How WhereBuilder handles complex conditions
- When to use Raw SQL vs QueryBuilder methods
- Extending WhereBuilder for custom operators

---

### **PHASE 4: Handle Subqueries & Aggregations** (25 min)

#### Step 4.1: Get Tags Array (Subquery Replacement)
**Goal:** Fetch tags separately instead of as subquery

**Exercise:**

```typescript
// STEP 5: After main query, fetch tags separately
const getUserTags = async (userId: number) => {
  const result = await UserTags.select(['t.id', 't.name'])
    .from('user_tags ut')
    .join('INNER', 'tags t', 'ut.tag_id = t.id')
    .where('ut.user_id', userId)
    .run();
  
  return result.rows.map(r => r.name);
};
```

**What to Learn:**
- Breaking down subqueries into separate queries
- Why this can be more efficient than subqueries
- Mapping results to desired format

#### Step 4.2: Get Photos JSON Array (Subquery Replacement)
**Goal:** Fetch photos separately

**Exercise:**

```typescript
// STEP 6: Fetch photos for each profile
const getProfilePhotos = async (userId: number) => {
  const result = await Photos.select(['id', 'photo_url', 'is_profile_picture'])
    .where('user_id', userId)
    .run();
  
  return result.rows || [];
};
```

#### Step 4.3: Get Like/Block Status
**Goal:** Check relationships separately

**Exercise:**

```typescript
// STEP 7: Check like status for current user
const getLikeStatus = async (currentUserId: number, targetUserId: number) => {
  const liked = await Likes.select(['id'])
    .where('liker_user_id', currentUserId)
    .where('liked_user_id', targetUserId)
    .run();
  
  const theyLiked = await Likes.select(['id'])
    .where('liker_user_id', targetUserId)
    .where('liked_user_id', currentUserId)
    .run();
  
  return {
    already_liked: liked.rowCount > 0,
    they_liked_us: theyLiked.rowCount > 0
  };
};
```

---

### **PHASE 5: Assemble Full Function** (25 min)

#### Step 5.1: Combine All Parts
**Goal:** Write complete `searchSuggestions2` using hybrid approach

**Exercise:** Pseudocode structure:

```typescript
export const searchSuggestions2 = async (
  userId: number,
  filters: SuggestionFilters
): Promise<SuggestionResult[]> => {
  // 1. Get current user location
  const currentUserProfile = await getProfileWithLocation(userId);
  const { latitude: userLat, longitude: userLon } = currentUserProfile;
  
  // 2. Get current user's tags
  const userTags = await getUserTags(userId);
  const userTagIds = userTags.map(t => t.id);
  
  // 3. Build main ORM query for base profiles
  let baseProfiles = await buildSuggestionQuery(userId, filters, userLat, userLon);
  
  // 4. Enrich each profile with additional data
  const enriched = await Promise.all(
    baseProfiles.map(async (profile) => ({
      ...profile,
      distance: calculateDistance(userLat, userLon, profile.latitude, profile.longitude),
      tags: await getUserTags(profile.id),
      photos: await getProfilePhotos(profile.id),
      common_tags: await countCommonTags(userTagIds, profile.id),
      ...(await getLikeStatus(userId, profile.id))
    }))
  );
  
  // 5. Apply final sorting and filtering
  return applySortingAndFilters(enriched, filters);
};
```

**What to Learn:**
- Combining ORM queries with TypeScript logic
- Using `Promise.all()` for parallel data fetching
- Post-processing results in JavaScript

#### Step 5.2: Performance Optimization
**Goal:** Reduce N+1 queries

**Exercise:** Batch fetch data:

```typescript
// Instead of fetching each profile's tags/photos individually
const allProfileIds = baseProfiles.map(p => p.id);

// Batch fetch all tags at once
const allTags = await UserTags.select(['ut.user_id', 't.name'])
  .from('user_tags ut')
  .join('INNER', 'tags t', 'ut.tag_id = t.id')
  .where('ut.user_id', allProfileIds, 'in')
  .run();

// Group by user_id
const tagsByUser = groupBy(allTags, 'user_id');

// Now just look up from map instead of querying
const profileWithTags = baseProfiles.map(p => ({
  ...p,
  tags: tagsByUser[p.id] || []
}));
```

---

### **PHASE 6: Testing & Validation** (20 min)

#### Step 6.1: Unit Tests
**Goal:** Test each component independently

**Exercise:**
1. Test `getProfileWithLocation()` - returns user location
2. Test `getUserTags()` - returns correct tags
3. Test distance calculation - returns correct km value
4. Test full `searchSuggestions2()` - returns profiles matching filters

#### Step 6.2: Integration Test
**Goal:** Test with actual test data

**Exercise:**
```bash
# Verify suggestions work with test users
# Should return:
# - Verified users
# - With profiles complete
# - With photos
# - Not blocked
# - Not already liked
```

#### Step 6.3: Performance Benchmark
**Goal:** Compare old vs new implementation

**Exercise:**
- Old query: Time single complex SQL
- New approach: Time ORM + enrichment
- Check if new is faster/slower
- Optimize if needed

---

### **PHASE 7: Deployment** (10 min)

#### Step 7.1: Update Controller
**Goal:** Ensure controller still works with new function

**Exercise:**
```typescript
// In matchingController.ts - should still work unchanged
const result = await searchSuggestions2(userId, filters);
res.json({
  suggestions: result.rows,
  count: result.length,
  ...pagination
});
```

#### Step 7.2: Remove Old Raw SQL Function
**Goal:** Clean up the old implementation

**Exercise:**
1. Delete old `searchSuggestions2` function completely
2. Verify no other files reference old version
3. Test endpoint still works

---

## ✅ Checklist

- [ ] Phase 1: Understand current query structure
- [ ] Phase 2: Design function signature and types
- [ ] Phase 3: Implement core ORM queries
- [ ] Phase 4: Handle subqueries with separate queries
- [ ] Phase 5: Assemble full function with enrichment
- [ ] Phase 6: Write and run tests
- [ ] Phase 7: Deploy and verify

---

## 🎓 Learning Outcomes

After completing this exercise, you will understand:
1. ✅ How to use custom ORM for complex queries
2. ✅ When to use Raw SQL vs QueryBuilder
3. ✅ How to structure hybrid ORM + TypeScript solutions
4. ✅ N+1 query problem and batch fetching
5. ✅ Post-processing results in application logic

---

## 📌 Key Gotchas to Watch

1. **CTE Replacement:** CTEs in SQL become separate queries + grouping in JavaScript
2. **Subqueries:** Can be replaced with separate queries, but watch for N+1 problem
3. **Complex Math:** Haversine formula likely needs `Raw()` to avoid recalculating in app
4. **Performance:** Going from 1 query to 5+ queries - batch fetch related data
5. **Type Safety:** Make sure result types match both old and new implementations

---

## 📚 Reference Files to Study

1. `/backend/src/models/matchModel.ts` - Current implementation (to understand logic)
2. `/backend/database/model.ts` - Base Model class
3. `/backend/database/query_builder.ts` - QueryBuilder methods
4. `/backend/src/controllers/matchingController.ts` - How suggestions are called
5. Similar ORM patterns in other model files (profileModel, chatModel, etc.)

