# Complete ORM Refactoring for Suggestions Query

**Status**: PLAN DRAFT (awaiting exploration results)
**Created**: 2026-04-26
**Priority**: CRITICAL - Blocks suggestions endpoint
**Estimated Duration**: 2-3 hours
**Complexity**: High (complex filtering, subqueries, post-processing)

---

## Executive Summary

The `searchSuggestions2()` function in `backend/src/models/matchModel.ts` is incomplete - it returns an empty array `[]` instead of query results. Previous work started converting the raw SQL suggestions query to use the custom ORM (`QueryBuilder`), but the implementation was never finished.

**Current State**:
- Function builds a `QueryBuilder` object for user selection (lines 74-102)
- Query is never executed (no `.run()` call)
- Returns placeholder empty array (line 106)
- Original raw SQL query is preserved as comments (lines 109-206+)

**Goal**: Complete the ORM refactoring while:
1. Maintaining the custom ORM's QueryBuilder pattern
2. Handling complex calculations (distance via Haversine, age from birthdate, common tags)
3. Implementing post-query filtering and sorting in TypeScript
4. Restoring all functionality from original raw SQL implementation

---

## Architecture Decision: Hybrid ORM + TypeScript Post-Processing

**Why Hybrid Approach** (Validated by Exploration):
- ✅ Haversine distance formula is too complex for ORM WHERE clauses → Calculate in TypeScript
  - Existing patterns: Frontend uses Array.sort for complex criteria (ChatContext.tsx)
  - Codebase comment explicitly suggests: "Use TypeScript for post-processing"
  
- ✅ JSON aggregation (tags, photos) not well-supported by custom ORM → Fetch separately
  - Sequential ORM queries used in profileController.ts (proven pattern)
  - Simple: Batch fetch tags and photos after main user query
  
- ✅ Complex EXISTS subqueries → Use TypeScript Set operations for efficiency
  - Example: `Set.intersection` for common tags, Set lookup for blocks
  
- ✅ Sorting by multiple calculated fields → Sort after results in memory
  - Pattern exists in ChatContext.tsx for timestamp sorting
  - Multi-criteria sort: `(a, b) => b.common_tags - a.common_tags || a.distance - b.distance`

**QueryBuilder API Usage** (From Codebase):
```typescript
// Core methods available
User.select(columns)      // Can include Raw() expressions
  .from('users u')         // Supports aliasing
  .join('INNER', 'profiles p', 'u.id = p.user_id')
  .where('u.id', userId, '!=')
  .where('u.is_verified', true)
  .orderBy('column', 'ASC')
  .run()                   // ← CRITICAL: Must call to execute
  .then(result => result.rows)  // Returns pg.Result
```

**Data Flow**:
```
1. User location validation (ORM) → extract lat/lon
   ↓
2. Current user profile fetch (ORM) → get preferences
   ↓
3. All candidate users fetch (ORM) with basic WHERE
   ↓
4. Batch fetch tags for all candidates (ORM) → separate query
   ↓
5. Batch fetch photos for all candidates (ORM) → separate query
   ↓
6. Post-process in TypeScript (Memory):
   - Calculate distance for each (Haversine)
   - Filter by distance threshold
   - Count common tags using Set intersection
   - Filter blocks and likes (Set lookup)
   - Apply gender/preference filters
   - Apply age/fame filters
   - Sort by selected criteria
   ↓
7. Pagination and response
```

---

---

## Implementation Tasks

### Phase 1: Setup & Data Extraction

**Task 1.1**: Fix typo in gender check
- Line 90: Change `'make'` → `'male'`
- Scope: 1 line

**Task 1.2**: Complete user location extraction
- Lines 50-52 are already working
- Verify structure: `{ latitude: userLat, longitude: userLon }`
- No changes needed

**Task 1.3**: Validate current user profile has required fields
- Ensure: `biography`, `gender`, `sexual_preference`, `latitude`, `longitude`, `birth_date`
- If any missing → Throw error with descriptive message
- Scope: Add null check after line 70

---

### Phase 2: Build ORM Query for User Selection

**Task 2.1**: Complete the `.where()` conditions
- [ ] Uncomment/add: `where('u.id', userId, '!=')`  → Already exists line 87
- [ ] Add: `where('u.is_verified', true)` → Already exists line 88
- [ ] Add: `where('p.gender', 'IS NOT', 'NULL')`
- [ ] Add: `where('p.sexual_preference', 'IS NOT', 'NULL')`
- [ ] Add: `where('p.latitude', 'IS NOT', 'NULL')`
- [ ] Add: `where('p.longitude', 'IS NOT', 'NULL')`

**Task 2.2**: Add Required/Raw Columns
- Current select (line 74-84) includes:
  - User fields: `u.id`, `u.username`, `u.first_name`, `u.last_name`
  - Profile fields: `p.gender`, `p.biography`, `p.fame_rating`, `p.city`, `p.country`, `p.is_online`, `p.last_seen`, `p.latitude`, `p.longitude`
  - Calculated fields: `distance` (Raw), `age` (Raw)
- [ ] Verify all required columns present
- [ ] Structure matches `SuggestionResult` interface

**Task 2.3**: Execute the query
- [ ] Add `.run()` at end of query chain
- [ ] Handle error: Check if `result.rows` is undefined/empty
- [ ] Extract `users: result.rows`

---

### Phase 3: Filter by Blocking Relationships

**Task 3.1**: Fetch blocking relationships
- [ ] Query `blocks` table for:
  - Users blocking current user: `blocker_user_id = currentUser.id`
  - Users blocked by current user: `blocked_user_id = currentUser.id`
- [ ] Create Set: `const blockedUserIds = new Set([...blockerIds, ...blockedIds])`

**Task 3.2**: Filter users
- [ ] Remove any user in `blockedUserIds` from results

---

### Phase 4: Filter by Like Status (Deduplication)

**Task 4.1**: Fetch current user's likes
- [ ] Query `likes` table: `liker_user_id = currentUser.id`
- [ ] Create Set: `const likedUserIds = new Set(likeResults.map(r => r.liked_user_id))`

**Task 4.2**: Filter users
- [ ] Remove any user in `likedUserIds` from results

---

### Phase 5: Calculate Distance & Filter

**Task 5.1**: Haversine Formula Implementation
```typescript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

**Task 5.2**: Calculate distance for each user
- [ ] For each user in results: `user.distance = calculateDistance(userLat, userLon, user.latitude, user.longitude)`
- [ ] Convert string coordinates to numbers first

**Task 5.3**: Filter by maxDistance
- [ ] Keep only: `user.distance <= maxDistance` (default 500 km)

---

### Phase 6: Add Tags & Photos

**Task 6.1**: Batch fetch user tags
- [ ] Get all users' IDs: `const userIds = users.map(u => u.id)`
- [ ] Query `user_tags` JOIN `tags`:
  ```sql
  SELECT ut.user_id, t.name, t.id
  FROM user_tags ut
  JOIN tags t ON ut.tag_id = t.id
  WHERE ut.user_id = ANY($1)
  ```
- [ ] Group by user_id → Create `tagsByUserId` Map

**Task 6.2**: Add tags to user objects
- [ ] `user.tags = tagsByUserId.get(user.id) || []`

**Task 6.3**: Count common tags
- [ ] Fetch current user's tags: `SELECT tag_id FROM user_tags WHERE user_id = currentUser.id`
- [ ] Create Set: `currentUserTagIds`
- [ ] For each user: `user.common_tags = user.tags.filter(t => currentUserTagIds.has(t.id)).length`

**Task 6.4**: Batch fetch user photos
- [ ] Query `photos WHERE user_id = ANY($1) AND is_profile_picture = true`
- [ ] Group by user_id → Create `photosByUserId` Map

**Task 6.5**: Add photos to user objects
- [ ] `user.photos = photosByUserId.get(user.id) || []`

---

### Phase 7: Gender & Preference Filtering

**Task 7.1**: Build gender filter logic
```typescript
const genderRequirements = [];
// Current user wants these genders
if (currentUser.sexual_preference === 'male') {
  genderRequirements.push(u => u.gender === 'male');
} else if (currentUser.sexual_preference === 'female') {
  genderRequirements.push(u => u.gender === 'female');
}
// Mutual preference check
genderRequirements.push(u => 
  u.sexual_preference === currentUser.gender ||
  u.sexual_preference === 'bisexual'
);
```

**Task 7.2**: Apply gender filter
- [ ] Filter users based on all gender requirements

---

### Phase 8: Age & Fame Filtering

**Task 8.1**: Apply age filters (if provided)
- [ ] `minAge`: Keep only `user.age >= minAge`
- [ ] `maxAge`: Keep only `user.age <= maxAge`

**Task 8.2**: Apply fame filters (if provided)
- [ ] `minFame`: Keep only `user.fame_rating >= minFame`
- [ ] `maxFame`: Keep only `user.fame_rating <= maxFame`

---

### Phase 9: Sorting

**Task 9.1**: Implement sorting strategies
```typescript
switch (sortBy) {
  case 'distance':
    return users.sort((a, b) => a.distance - b.distance || b.fame_rating - a.fame_rating);
  case 'fame':
    return users.sort((a, b) => b.fame_rating - a.fame_rating || a.distance - b.distance);
  case 'age':
    return users.sort((a, b) => a.age - b.age || a.distance - b.distance);
  case 'tags':
    return users.sort((a, b) => b.common_tags - a.common_tags || a.distance - b.distance);
  default:
    return users;
}
```

---

### Phase 10: Pagination

**Task 10.1**: Apply limit and offset
- [ ] `const paginated = users.slice(offset, offset + limit)`

---

### Phase 11: Type Safety & Testing

**Task 11.1**: Verify SuggestionResult interface
- [ ] Check type definition for `SuggestionResult`
- [ ] Ensure all fields are present in returned objects

**Task 11.2**: Test with seeded data
- [ ] Run suggestions endpoint
- [ ] Verify: Returns non-empty array
- [ ] Verify: Distance calculations accurate
- [ ] Verify: Filtering works (gender, age, fame, distance)
- [ ] Verify: Sorting works correctly

---

## Decision Points Requiring User Input

**None at planning stage** - Architecture already decided (hybrid ORM + TypeScript).

Implementation decisions are local to each task and can be made automatically.

---

## Validation Criteria (Must All Pass)

- [ ] Suggestions endpoint returns non-empty results
- [ ] Returns correct number of suggestions (count matches response)
- [ ] Distance calculations are accurate (spot-check with calculator)
- [ ] Gender filtering works (opposite gender only when requested)
- [ ] No blocked users appear in suggestions
- [ ] No previously-liked users appear in suggestions
- [ ] Age filtering works (min/max age respected)
- [ ] Fame filtering works (min/max rating respected)
- [ ] Sorting by distance shows closest first
- [ ] Sorting by fame shows highest rating first
- [ ] Pagination works (offset/limit respected)
- [ ] Tags count is accurate
- [ ] Photos are included with correct data

---

## Implementation Constraints

**Do NOT**:
- Break existing TypeScript types
- Change function signature of `searchSuggestions2`
- Modify the test data seeding script
- Commit debug console.log statements (remove before commit)

**Must Use**:
- Custom QueryBuilder ORM (User, Profiles models)
- TypeScript for post-processing
- Raw() wrapper for complex calculations already done in ORM

---

## Files to Modify

1. **Primary**: `backend/src/models/matchModel.ts` (searchSuggestions2 function)
2. **Reference**: `backend/src/controllers/matchingController.ts` (how function is called)
3. **Reference**: `backend/database/query_builder.ts` (ORM methods)
4. **Testing**: Use curl + seeded data to validate

---

## Rollback Plan

If implementation breaks badly:
```bash
# Restore original raw SQL version
git checkout fd53518 -- backend/src/models/matchModel.ts
# Or manually restore from commented-out code (lines 109-206+)
```

---

## Next Steps After Completion

1. Remove all console.log statements from implementation
2. Create atomic git commits per phase
3. Run final integration test with seeded users
4. Document any deviations from original SQL behavior
5. Consider performance implications of post-processing approach
   - May need optimization if result set is large
   - Alternative: Move some filtering back to database WHERE clauses

---

## Appendix: Original Raw SQL (For Reference)

See commented lines 109-206+ in `matchModel.ts` for complete original query structure.

Key features to preserve:
- Distance calculation (Haversine formula)
- Age extraction from birth_date
- Tag aggregation with counts
- Photo JSON aggregation
- Photo existence check (must have profile picture)
- Already-liked filtering
- Block relationship filtering
- Gender and preference mutual matching

