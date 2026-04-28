# Refactor getAllMatches to Use ORM Instead of Raw SQL

**Status**: PLAN READY
**Created**: 2026-04-26
**Priority**: MEDIUM (consistency with searchSuggestions2 pattern)
**Estimated Duration**: 1.5-2 hours
**Complexity**: Medium (multi-table joins, post-processing required)

---

## Executive Summary

The `getAllMatches()` function in `backend/src/models/matchModel.ts` (lines 215-272) currently uses raw SQL with JSON aggregation to fetch mutual matches.

**Goal**: Refactor to use the custom ORM (`QueryBuilder`) pattern + TypeScript post-processing, matching the approach already proven in `searchSuggestions2()`.

**Why**: 
- Consistency: `searchSuggestions2` already uses hybrid ORM + TypeScript successfully
- Maintainability: Code patterns should be consistent across model functions
- Flexibility: Same post-processing approach (batch queries, Set operations, in-memory filtering)

---

## Current Implementation Analysis

**Raw SQL Query** (lines 216-268):
- Mutual likes join: `l1.liker_user_id = l2.liked_user_id AND l1.liked_user_id = l2.liker_user_id`
- Returns: User data + JSON-aggregated photos + JSON-aggregated tags
- Sorting: `ORDER BY p.fame_rating DESC`
- Pagination: `LIMIT $2 OFFSET $3`

**Current Issues**:
- ❌ Uses raw SQL (not ORM)
- ❌ JSON aggregation in database (complex GROUP BY)
- ❌ Returns objects instead of primitives (tags need to be transformed)

**What Works**:
- ✅ Mutual match logic is correct
- ✅ Pagination parameters are clear
- ✅ Data fetching logic is sound

---

## Architecture Decision: Hybrid ORM + TypeScript

**Same Pattern as searchSuggestions2**:

```
1. Fetch current user location (validation)
   ↓
2. Find mutual matches (ORM with JOIN on likes table)
   ↓
3. Batch fetch tags for matched users (ORM)
   ↓
4. Batch fetch photos for matched users (ORM)
   ↓
5. Post-process in TypeScript:
   - Combine tags/photos with user data
   - Sort by fame rating
   - Apply pagination
   ↓
6. Return response
```

---

## Implementation Plan

### Phase 1: Extract Mutual Match User IDs

**Task 1.1**: Fetch mutual match relationships
- Use `Likes` model to find mutual likes
- Query structure:
  ```typescript
  const mutualMatches = await Likes.select(['l1.liked_user_id'])
    .from('likes l1')
    .join('INNER', 'likes l2', 
      'l1.liker_user_id = l2.liked_user_id AND l1.liked_user_id = l2.liker_user_id')
    .where('l1.liker_user_id', userId)
    .run()
    .then(res => res.rows);
  ```
- Extract matched user IDs: `const matchedUserIds = mutualMatches.map(m => m.liked_user_id);`

**Decision Point**: 
- Alternative: Use Raw SQL for the mutual join logic since it's complex
- Recommendation: Use ORM with Raw for the complex join condition if needed

---

### Phase 2: Fetch Match User Profiles

**Task 2.1**: Fetch all user and profile data for matched users
- Select required columns: id, username, first/last name, gender, sexual_preference, biography, city, country, fame_rating, last_seen, is_online, birth_date, latitude, longitude
- Use ORM:
  ```typescript
  const matchedUsers = await User.select([
    'u.id', 'u.username', 'u.first_name', 'u.last_name',
    'p.gender', 'p.sexual_preference', 'p.biography', 'p.city', 'p.country',
    'p.fame_rating', 'p.last_seen', 'p.is_online', 'p.latitude', 'p.longitude',
    new Raw(`EXTRACT(YEAR FROM AGE(p.birth_date)) as age`)
  ])
    .from('users u')
    .join('INNER', 'profiles p', 'u.id = p.user_id')
    .whereIn('u.id', matchedUserIds)
    .run()
    .then(res => res.rows);
  ```

**Key Difference from Raw SQL**:
- No JSON aggregation in query
- Will fetch user records separately, then add photos/tags via batch queries

---

### Phase 3: Sort by Fame Rating

**Task 3.1**: Sort matched users in TypeScript
```typescript
matchedUsers.sort((a, b) => {
  // Note: fame_rating comes as string from DECIMAL column, convert to number
  const fameDiff = Number(b.fame_rating) - Number(a.fame_rating);
  return fameDiff !== 0 ? fameDiff : 0;
});
```

**Decision**: 
- Move sorting to TypeScript (after all data loaded)
- Makes pagination work correctly
- Explicitly convert fame_rating to number since PostgreSQL DECIMAL returns as string via pg driver

---

### Phase 4: Pagination

**Task 4.1**: Apply pagination after sorting
```typescript
const limit = parseInt(data.limit) || 20;
const offset = parseInt(data.offset) || 0;
const paginatedUsers = matchedUsers.slice(offset, offset + limit);
```

---

### Phase 5: Batch Fetch Photos

**Task 5.1**: Get all photos for paginated users
- Use ORM batch query:
  ```typescript
  const paginatedUserIds = paginatedUsers.map(u => u.id);
  const allPhotos = await Photos.select(['id', 'user_id', 'photo_url', 'is_profile_picture'])
    .whereIn('user_id', paginatedUserIds)
    .run()
    .then(res => res.rows);
  ```

**Task 5.2**: Group photos by user_id
```typescript
const photosByUserId = allPhotos.reduce((acc, photo) => {
  if (!acc[photo.user_id]) acc[photo.user_id] = [];
  acc[photo.user_id].push(photo);
  return acc;
}, {} as Record<number, any[]>);
```

---

### Phase 6: Batch Fetch Tags

**Task 6.1**: Get all tags for paginated users
- Use ORM batch query:
  ```typescript
  const allTags = await UserTags.select(['ut.user_id', 't.name', 't.id'])
    .from('user_tags ut')
    .join('INNER', 'tags t', 'ut.tag_id = t.id')
    .whereIn('ut.user_id', paginatedUserIds)
    .run()
    .then(res => res.rows);
  ```

**Task 6.2**: Group tags by user_id (keeping user_id for grouping only)
```typescript
const tagsByUserId = allTags.reduce((acc, tag) => {
  if (!acc[tag.user_id]) acc[tag.user_id] = [];
  // Keep only {id, name}, remove user_id from final structure
  acc[tag.user_id].push({ id: tag.id, name: tag.name });
  return acc;
}, {} as Record<number, any[]>);
```

---

### Phase 7: Combine Data

**Task 7.1**: Attach photos and tags to each user
```typescript
paginatedUsers.forEach(u => {
  u.photos = photosByUserId[u.id] || [];
  u.tags = tagsByUserId[u.id] || [];
});
```

---

### Phase 8: Return Response

**Task 8.1**: Return final result
```typescript
return { rows: paginatedUsers };
```

---

## Decision Points Requiring User Input

**None at planning stage** - Architecture already decided (match searchSuggestions2 pattern).

---

## Critical Implementation Notes

### Mutual Match Logic

The current SQL does:
```sql
JOIN likes l2 
  ON l1.liker_user_id = l2.liked_user_id
  AND l1.liked_user_id = l2.liker_user_id
```

This translates to ORM as:
```typescript
.join('INNER', 'likes l2', 'l1.liker_user_id = l2.liked_user_id AND l1.liked_user_id = l2.liker_user_id')
```

**Verify**: The ORM's `.join()` method supports complex ON conditions with `AND`.

### Pagination Correctness

**Important**: Must paginate AFTER sorting but BEFORE fetching tags/photos:
```
1. Fetch all matched users
2. Sort by fame_rating DESC
3. Slice for pagination (offset, limit)
4. Then batch fetch tags/photos only for paginated set
```

This prevents fetching tags/photos for all matches (expensive) when only returning 20.

### Performance Characteristics

| Step | Queries | Complexity |
|------|---------|------------|
| Get match IDs | 1 | O(1) - index on (liker_user_id, liked_user_id) |
| Fetch user profiles | 1 | O(n) - where n = matched users |
| Sort | 0 | O(n log n) - in-memory |
| Paginate | 0 | O(limit) - array slice |
| Batch fetch photos | 1 | O(limit) - whereIn uses index |
| Batch fetch tags | 1 | O(limit) - whereIn uses index |
| **Total** | **4 DB queries** | **Efficient** |

**vs Raw SQL**: 1 query but complex GROUP BY with JSON aggregation (slower for large result sets).

---

## Validation Criteria

- [ ] getAllMatches returns same structure as before: `{rows: [...]}`
- [ ] Each user object includes: id, username, name, gender, pref, bio, city, country, fame_rating, last_seen, is_online, age, latitude, longitude, photos, tags
- [ ] Photos array structure: `[{id, photo_url, is_profile_picture}, ...]`
- [ ] Tags array structure: `[{id, name}, ...]` (no user_id in final objects)
- [ ] Sorted by fame_rating DESC (highest first)
- [ ] Pagination works correctly (offset/limit respected)
- [ ] Only returns mutual matches (bidirectional likes)
- [ ] Performance: No N+1 queries (all batch fetched)
- [ ] fame_rating numeric comparison works correctly (type converted)

---

## Testing Strategy

**Before Refactoring**:
1. Call existing `getAllMatches` with test data
2. Record expected output structure and values

**After Refactoring**:
1. Call new ORM-based `getAllMatches` with same parameters
2. Verify output structure matches exactly
3. Verify data content matches (same users, same order, same tags/photos)
4. Test pagination edge cases: offset=0, offset > total, limit=1, limit=1000

**Test Scenario**:
- User with 5+ mutual matches
- Test with different limit/offset combinations
- Verify tags and photos are complete and correct

---

## Files to Modify

1. **Primary**: `backend/src/models/matchModel.ts` (getAllMatches function, lines 215-272)
2. **Reference**: `searchSuggestions2` (same file, lines 46-212) - use as pattern reference

---

## Alternative Approaches Considered

**Option 1** (Chosen): ORM + TypeScript post-processing
- ✅ Consistent with searchSuggestions2
- ✅ Flexible for future additions
- ✅ Easier to debug
- ⚠️ 4 DB queries instead of 1

**Option 2**: Keep raw SQL
- ✅ Single query
- ❌ Inconsistent with codebase direction
- ❌ Complex GROUP BY logic

**Option 3**: Use Raw SQL with ORM wrapper
- ✅ Single query, ORM structure
- ❌ Still using raw SQL
- ❌ Defeats purpose of ORM refactoring

---

## Rollback Plan

If implementation has issues:
```bash
# Keep lines 216-272 commented
# Revert to raw SQL implementation
git checkout HEAD -- backend/src/models/matchModel.ts
```

---

## Related Functions to Consider

**Future refactoring**: Same pattern should apply to:
- `getUserLikes()` (lines 296-354) - Currently raw SQL
- `getProfileDataforMatches()` (lines 275-293) - Could be simplified
- `getMatchesCount()` (lines 361-373) - Simple, could stay as-is

---

## Next Steps After Completion

1. ✅ Test getAllMatches with seeded data
2. ✅ Verify matches display correctly in frontend
3. ✅ Profile detail sidebar shows correct tags/photos
4. Consider refactoring getUserLikes() same way
5. Consider refactoring getMatchesCount() same way

