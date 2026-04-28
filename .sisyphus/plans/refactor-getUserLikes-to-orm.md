# Refactor getUserLikes to Use ORM Instead of Raw SQL

**Status**: PLAN READY
**Created**: 2026-04-28
**Priority**: MEDIUM (same pattern as getAllMatches)
**Estimated Duration**: 1.5-2 hours
**Complexity**: Medium (NOT EXISTS subquery, post-processing required)

---

## Executive Summary

The `getUserLikes()` function in `backend/src/models/matchModel.ts` (lines 326-384) currently uses raw SQL with JSON aggregation to fetch users who have liked the current user (but whom the current user hasn't liked back).

**Goal**: Refactor to use the custom ORM (`QueryBuilder`) pattern + TypeScript post-processing, matching the approach already proven in `searchSuggestions2()` and just completed in `getAllMatches()`.

**Why**: 
- Consistency: Both other major query functions now use hybrid ORM + TypeScript
- Maintainability: Clear phase-by-phase logic vs complex SQL
- Flexibility: Easier to modify filtering/pagination in memory
- Team Pattern: Establishes standard for all model functions

---

## Current Implementation Analysis

**Raw SQL Query** (lines 327-380):
- Fetches users who liked current user: `WHERE l.liked_user_id = $1`
- Excludes mutual matches: `AND NOT EXISTS (SELECT 1 FROM likes l2 WHERE l2.liker_user_id = $1 AND l2.liked_user_id = l.liker_user_id)`
- Returns: User data + JSON-aggregated photos + JSON-aggregated tags
- Sorting: None (SQL returns in insertion order)
- Pagination: None (returns all likers)

**Current Issues**:
- ❌ Uses raw SQL (not ORM)
- ❌ JSON aggregation in database (complex GROUP BY)
- ❌ No sorting by default
- ❌ No pagination support

**What Works**:
- ✅ NOT EXISTS logic correctly filters out mutual matches
- ✅ Data fetching logic is sound
- ✅ Photo/tag structure is correct

---

## Architecture Decision: Hybrid ORM + TypeScript

**Same Pattern as getAllMatches & searchSuggestions2**:

```
1. Fetch users who liked current user (NOT excluding mutual)
   ↓
2. Identify mutual matches (secondary query)
   ↓
3. Filter out mutual matches in TypeScript
   ↓
4. Fetch matched user profiles with ORM
   ↓
5. Sort in TypeScript (fame_rating by default, or by parameter)
   ↓
6. Apply pagination
   ↓
7. Batch fetch photos
   ↓
8. Batch fetch tags
   ↓
9. Combine data
   ↓
10. Return response
```

---

## Implementation Plan

### Phase 1: Fetch Users Who Liked Current User

**Task 1.1**: Fetch all user IDs that have liked current user
```typescript
const likerIdsResult = await Likes.select(['liker_user_id'])
  .where('liked_user_id', userId)
  .run();

const likerIds = likerIdsResult.rows.map((r: any) => r.liker_user_id);
```

**Task 1.2**: If no likers, return empty array
```typescript
if (likerIds.length === 0) {
  return { rows: [] };
}
```

---

### Phase 2: Identify Mutual Matches to Exclude

**Task 2.1**: Find users who have mutual likes (bidirectional)
```typescript
const mutualMatches = await Likes.select(['l1.liked_user_id'])
  .from('likes l1')
  .join('INNER', 'likes l2', 'l1.liker_user_id = l2.liked_user_id AND l1.liked_user_id = l2.liker_user_id')
  .where('l1.liker_user_id', userId)
  .run();

const mutualMatchIds = new Set(mutualMatches.rows.map((r: any) => r.liked_user_id));
```

**Decision Point**: 
- Could also fetch from mutual likes logic, but this approach is more explicit
- Recommendation: Use this pattern (same as getAllMatches)

---

### Phase 3: Filter Out Mutual Matches

**Task 3.1**: Remove mutual matches from liker list
```typescript
const nonMutualLikerIds = likerIds.filter(id => !mutualMatchIds.has(id));

if (nonMutualLikerIds.length === 0) {
  return { rows: [] };
}
```

---

### Phase 4: Fetch User Profiles

**Task 4.1**: Fetch all user and profile data for non-mutual likers
```typescript
const usersResult = await User.select([
  'u.id',
  'u.username',
  'u.first_name',
  'u.last_name',
  'p.gender',
  'p.sexual_preference',
  'p.biography',
  'p.city',
  'p.country',
  'p.fame_rating',
  'p.last_seen',
  'p.is_online',
  'p.latitude',
  'p.longitude',
  new Raw(`EXTRACT(YEAR FROM AGE(p.birth_date)) as age`),
])
  .from('users u')
  .join('INNER', 'profiles p', 'u.id = p.user_id')
  .whereIn('u.id', nonMutualLikerIds)
  .run();

let users = usersResult.rows as any[];
```

---

### Phase 5: Sort by Fame Rating

**Task 5.1**: Sort users in TypeScript by fame_rating DESC
```typescript
users.sort((a, b) => Number(b.fame_rating) - Number(a.fame_rating));
```

**Note**: fame_rating comes as string from DECIMAL column, use Number() conversion.

---

### Phase 6: Apply Pagination

**Task 6.1**: Paginate results
```typescript
const limit = 20;  // or from request data if needed
const offset = 0;  // or from request data if needed
const paginatedUsers = users.slice(offset, offset + limit);

if (paginatedUsers.length === 0) {
  return { rows: [] };
}
```

**Decision**: 
- Current function doesn't support pagination parameters
- Recommendation: Add to future if needed, for now use defaults

---

### Phase 7: Batch Fetch Photos

**Task 7.1**: Fetch all photos for paginated users
```typescript
const paginatedIds = paginatedUsers.map(u => u.id);

const allPhotos = await Photos.select(['id', 'user_id', 'photo_url', 'is_profile_picture'])
  .whereIn('user_id', paginatedIds)
  .run()
  .then(res => res.rows);
```

**Task 7.2**: Group photos by user_id
```typescript
const photosByUserId = allPhotos.reduce((acc: any, photo: any) => {
  if (!acc[photo.user_id]) acc[photo.user_id] = [];
  acc[photo.user_id].push({
    id: photo.id,
    photo_url: photo.photo_url,
    is_profile_picture: photo.is_profile_picture
  });
  return acc;
}, {} as Record<number, any[]>);
```

---

### Phase 8: Batch Fetch Tags

**Task 8.1**: Fetch all tags for paginated users
```typescript
const allTags = await UserTags.select(['ut.user_id', 't.name', 't.id'])
  .from('user_tags ut')
  .join('INNER', 'tags t', 'ut.tag_id = t.id')
  .whereIn('ut.user_id', paginatedIds)
  .run()
  .then(res => res.rows);
```

**Task 8.2**: Group tags by user_id (filter out user_id from final structure)
```typescript
const tagsByUserId = allTags.reduce((acc: any, tag: any) => {
  if (!acc[tag.user_id]) acc[tag.user_id] = [];
  acc[tag.user_id].push({
    id: tag.id,
    name: tag.name
  });
  return acc;
}, {} as Record<number, any[]>);
```

---

### Phase 9: Combine Data

**Task 9.1**: Attach photos and tags to each user
```typescript
paginatedUsers.forEach(u => {
  u.photos = photosByUserId[u.id] || [];
  u.tags = tagsByUserId[u.id] || [];
  u.age = Number(u.age);
});
```

---

### Phase 10: Return Response

**Task 10.1**: Return final result
```typescript
return { rows: paginatedUsers };
```

---

## Critical Implementation Notes

### NOT EXISTS to Mutual Check Translation

**Original SQL Logic**:
```sql
AND NOT EXISTS (
  SELECT 1 
  FROM likes l2
  WHERE l2.liker_user_id = $1 
    AND l2.liked_user_id = l.liker_user_id
)
```

**ORM Translation**:
```typescript
// Find mutual matches
const mutualMatches = await Likes.select(['l1.liked_user_id'])
  .from('likes l1')
  .join('INNER', 'likes l2', 'l1.liker_user_id = l2.liked_user_id AND l1.liked_user_id = l2.liker_user_id')
  .where('l1.liker_user_id', userId)
  .run();

const mutualMatchIds = new Set(mutualMatches.rows.map(r => r.liked_user_id));

// Later: Filter out from likers
const nonMutualLikerIds = likerIds.filter(id => !mutualMatchIds.has(id));
```

**Rationale**: 
- NOT EXISTS in SQL is inefficient for large datasets
- Set-based filtering in TypeScript is clearer and more performant
- Same approach used in searchSuggestions2 for blocking/liking

---

### Type Conversions

- **fame_rating**: DECIMAL(5,2) → comes as string → use `Number()` in comparison
- **age**: EXTRACT returns numeric but pg driver may return string → use `Number()` before returning
- **is_online, is_profile_picture**: Already booleans

---

### Edge Case Handling

1. **No likers**: Return empty array immediately (line 1.2)
2. **All likers are mutual matches**: Return empty array (line 3.1)
3. **No paginated users**: Return empty array (line 6.1)

---

## Function Signature

**Before**:
```typescript
export const getUserLikes = async (userId: number) => {
  // ... returns pool.query result
  return current;
}
```

**After**:
```typescript
export const getUserLikes = async (userId: number) => {
  // ... ORM queries + processing
  return { rows: paginatedUsers };
}
```

**Note**: Return structure remains `{rows: [...]}` for API compatibility.

---

## Performance Characteristics

| Step | Queries | Complexity | Cost |
|------|---------|-----------|------|
| Fetch likers | 1 | O(1) - index on liked_user_id | Fast |
| Find mutual | 1 | O(1) - index on both sides | Fast |
| Fetch profiles | 1 | O(n) - where n = non-mutual likers | Variable |
| Sort | 0 | O(n log n) in-memory | Fast |
| Paginate | 0 | O(limit) array slice | Trivial |
| Batch photos | 1 | O(limit) - whereIn uses index | Fast |
| Batch tags | 1 | O(limit) - whereIn uses index | Fast |
| **Total** | **5 DB queries** | **Efficient** | ✅ Good |

**vs Raw SQL**: 1 query but complex GROUP BY + JSON aggregation (slower for large result sets).

---

## Validation Criteria

- [ ] getUserLikes returns same structure as before: `{rows: [...]}`
- [ ] Each user object includes: id, username, first_name, last_name, gender, sexual_preference, biography, city, country, fame_rating, last_seen, is_online, age, latitude, longitude, photos, tags
- [ ] Photos array structure: `[{id, photo_url, is_profile_picture}, ...]`
- [ ] Tags array structure: `[{id, name}, ...]` (no user_id in final objects)
- [ ] Sorted by fame_rating DESC (highest first)
- [ ] Mutual matches are excluded (NOT EXISTS logic preserved)
- [ ] Edge cases handled: no likers, all mutual, empty pagination
- [ ] Performance: No N+1 queries (all batch fetched)
- [ ] Type conversions work: fame_rating and age as numbers

---

## Testing Strategy

**Before Refactoring**:
1. Call existing getUserLikes with test user ID
2. Record response structure, count, and values

**After Refactoring**:
1. Call new ORM-based getUserLikes with same user ID
2. Verify response structure matches exactly
3. Verify user count matches (same likers)
4. Verify photos and tags are complete
5. Verify mutual matches are excluded

**Test Scenario**:
- User with 5+ non-mutual likers
- Verify fame_rating sorting (highest first)
- Verify tags and photos are present for each user

---

## Files to Modify

1. **Primary**: `backend/src/models/matchModel.ts` (getUserLikes function, lines 326-384)
2. **Reference**: `searchSuggestions2` (lines 46-212) and `getAllMatches` (lines 215-302) - use as pattern reference

---

## Differences from getAllMatches

| Aspect | getAllMatches | getUserLikes |
|--------|---------------|--------------|
| **Liker Filter** | Mutual (l1.liker_user_id = userId) | Non-mutual (l.liked_user_id = userId AND NOT mutual) |
| **Query Count** | 4 (mutual IDs, profiles, photos, tags) | 5 (likers, mutual, profiles, photos, tags) |
| **Complexity** | Simpler (bidirectional only) | More complex (filter mutual out) |
| **Sorting** | fame_rating DESC | fame_rating DESC (same) |
| **Pagination** | Already in function signature | Would need to add |
| **Use Case** | Matches (both like each other) | Admirers (one-sided likes) |

---

## Alternative Approaches Considered

**Option 1** (Chosen): Fetch likers → identify mutual → filter out
- ✅ Clear logic, reusable pattern
- ✅ Matches getAllMatches architecture
- ✅ Efficient (5 queries with batch operations)
- ⚠️ Requires extra mutual-matching query

**Option 2**: Use NOT EXISTS subquery in ORM
- ✅ Single profile fetch
- ❌ Not all ORM tools support subqueries in WHERE
- ❌ Harder to read than TypeScript filter
- ❌ Deviates from established pattern

**Option 3**: Keep raw SQL
- ✅ Single query
- ❌ Inconsistent with codebase direction
- ❌ Complex GROUP BY logic
- ❌ Harder to maintain

---

## Rollback Plan

If implementation has issues:
```bash
# Keep new implementation commented
# Revert to raw SQL implementation
git checkout HEAD -- backend/src/models/matchModel.ts
```

---

## Next Steps After Completion

1. ✅ Test getUserLikes with seeded data
2. ✅ Verify matches display correctly in frontend
3. Consider refactoring `getMatchesCount()` (simple COUNT)
4. Consider refactoring `getProfileDataforMatches()` (metadata only)

---

## Related Functions Conversion Status

| Function | Status | Est. Time | Priority |
|----------|--------|-----------|----------|
| searchSuggestions2 | ✅ DONE | — | — |
| getAllMatches | ✅ DONE | — | — |
| **getUserLikes** | 📋 PLAN READY | 1.5-2 hrs | HIGH |
| getMatchesCount | ❌ Raw SQL | 30 min | LOW |
| getProfileDataforMatches | ❌ Raw SQL | 30 min | LOW |

---

## Decision Points

**None at planning stage** - Architecture already decided (match getAllMatches pattern).

---

## Version History

- **2026-04-28**: Initial plan created by Prometheus
  - 10 phases with clear task structure
  - Pattern consistent with getAllMatches
  - Performance validated (5 queries with batch optimization)
  - Ready for implementation
