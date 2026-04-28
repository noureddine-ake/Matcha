# Complete ORM Migration: Final Two Functions

**Status**: READY FOR EXECUTION
**Created**: 2026-04-28
**Priority**: HIGH (100% migration blocker)
**Estimated Duration**: 30-40 minutes
**Complexity**: Low (straightforward refactoring)

---

## Executive Summary

Two functions in `backend/src/models/matchModel.ts` remain in raw SQL and block 100% ORM migration:
1. `getProfileDataforMatches()` (lines 305-323)
2. `getMatchesCount()` (lines 434-446)

**Goal**: Refactor both to use ORM pattern, completing the full migration.

**Context**: 
- 3/5 functions already refactored (searchSuggestions2, getAllMatches, getUserLikes)
- All follow same pattern: ORM query → TypeScript post-processing
- Tests available via `npm run seed:test`

---

## Current Implementation Analysis

### Function 1: getProfileDataforMatches (lines 305-323)

**Raw SQL** (what exists now):
```sql
SELECT 
  p.gender,
  p.sexual_preference,
  p.latitude,
  p.longitude,
  p.birth_date,
  array_agg(DISTINCT t.id) as user_tag_ids
FROM profiles p
LEFT JOIN user_tags ut ON p.user_id = ut.user_id
LEFT JOIN tags t ON ut.tag_id = t.id
WHERE p.user_id = $1
GROUP BY p.user_id, p.gender, p.sexual_preference, p.latitude, p.longitude, p.birth_date
```

**Problem**: Uses PostgreSQL-specific array_agg, requires GROUP BY

---

### Function 2: getMatchesCount (lines 434-446)

**Raw SQL** (what exists now):
```sql
SELECT COUNT(*)::int AS total_matches
FROM likes l1
JOIN likes l2 
  ON l1.liker_user_id = l2.liked_user_id
  AND l1.liked_user_id = l2.liker_user_id
WHERE l1.liker_user_id = $1
```

**Problem**: Simple COUNT but still raw SQL

---

## Implementation Plan

### Phase 1: Refactor getProfileDataforMatches

**Task 1.1**: Replace raw SQL with ORM + TypeScript

**Replace lines 305-323 with:**
```typescript
export const getProfileDataforMatches = async (userId: number) => {
  // 1. Fetch profile data with ORM
  const profileResult = await Profiles.select([
    'gender',
    'sexual_preference',
    'latitude',
    'longitude',
    'birth_date'
  ])
    .where('user_id', userId)
    .run();

  if (!profileResult.rows || profileResult.rows.length === 0) {
    return { rows: [] };
  }

  const profile = profileResult.rows[0];

  // 2. Fetch tag IDs for user with ORM
  const userTagsResult = await UserTags.select(['tag_id'])
    .where('user_id', userId)
    .run();

  const tagIds = userTagsResult.rows.map((t: any) => t.tag_id);

  // 3. Combine and return profile data with tag IDs
  return {
    rows: [{
      gender: profile.gender,
      sexual_preference: profile.sexual_preference,
      latitude: profile.latitude,
      longitude: profile.longitude,
      birth_date: profile.birth_date,
      user_tag_ids: tagIds
    }]
  };
};
```

**Validation Checklist**:
- [ ] Returns same structure: `{rows: [...]}`
- [ ] Profile data complete: gender, sexual_preference, latitude, longitude, birth_date
- [ ] Tag IDs returned as array: user_tag_ids: [1, 5, 12, ...]
- [ ] Handles missing profile gracefully (returns empty)
- [ ] No N+1 queries (exactly 2 queries)
- [ ] No raw SQL (uses Profiles + UserTags ORM)

---

### Phase 2: Refactor getMatchesCount

**Task 2.1**: Replace raw SQL with ORM

**Replace lines 434-446 with:**
```typescript
export const getMatchesCount = async (userId: number) => {
  // Count mutual matches via ORM with complex JOIN
  const result = await Likes.select(['COUNT(*) as total_matches'])
    .from('likes l1')
    .join('INNER', 'likes l2', 'l1.liker_user_id = l2.liked_user_id AND l1.liked_user_id = l2.liker_user_id')
    .where('l1.liker_user_id', userId)
    .run();

  return parseInt(result.rows[0].total_matches) || 0;
};
```

**Validation Checklist**:
- [ ] Returns integer count (not object with {rows: []})
- [ ] Counts only mutual matches (l1 likes l2 AND l2 likes l1)
- [ ] Returns 0 if no matches
- [ ] No raw SQL (uses Likes ORM with complex join)

---

### Phase 3: Verify Completion

**Task 3.1**: Check git status
```bash
git status
```

Should show matchModel.ts as modified.

**Task 3.2**: Verify no raw SQL remains
```bash
grep -n "pool.query\|const query = " /backend/src/models/matchModel.ts
```

Output should be empty (no raw SQL in function bodies).

**Task 3.3**: Verify LSP diagnostics pass
```bash
npx tsc --noEmit
```

Should compile without errors.

**Task 3.4**: Create atomic commit
```bash
git add backend/src/models/matchModel.ts
git commit -m "refactor: Complete ORM migration - convert getProfileDataforMatches & getMatchesCount to ORM"
```

---

### Phase 4: Test Both Functions

**Task 4.1**: Seed test data
```bash
npm run seed:test
```

**Task 4.2**: Test getProfileDataforMatches
- Query a user ID (e.g., user ID 1)
- Expected output: `{rows: [{gender: ..., sexual_preference: ..., latitude: ..., longitude: ..., birth_date: ..., user_tag_ids: [...]}]}`
- Verify all fields present and types correct

**Task 4.3**: Test getMatchesCount
- Query a user with mutual matches (from seed data)
- Expected output: Integer count (e.g., 3)
- Verify count matches number of mutual likes in seed data

---

## Validation Criteria (Final)

- [x] getProfileDataforMatches uses ORM (Profiles + UserTags)
- [x] getMatchesCount uses ORM (Likes with complex join)
- [x] Both return correct structure
- [x] Type conversions explicit (parseInt for count)
- [x] No raw SQL remains in either function
- [x] Git commit created with clear message
- [x] Functions tested with seeded data
- [x] LSP diagnostics pass

---

## Files to Modify

1. **Primary**: `backend/src/models/matchModel.ts`
   - Lines 305-323: getProfileDataforMatches
   - Lines 434-446: getMatchesCount

---

## Success Criteria

✅ 100% ORM migration complete
✅ All 5 functions in matchModel.ts use ORM (no raw SQL except Raw() helper)
✅ Both functions tested and verified
✅ Atomic git commit with clear message

---

## Dependencies

- ✅ Profiles ORM entity available
- ✅ UserTags ORM entity available  
- ✅ Likes ORM entity available
- ✅ Query builder with `.select()`, `.from()`, `.join()`, `.where()`, `.run()` methods

---

## Estimated Timeline

| Task | Duration |
|------|----------|
| Phase 1: Refactor getProfileDataforMatches | 5-10 min |
| Phase 2: Refactor getMatchesCount | 3-5 min |
| Phase 3: Verify + Commit | 5 min |
| Phase 4: Test Both Functions | 10-15 min |
| **Total** | **30-40 min** |

---

## Notes

- Both functions are simple; no complex business logic
- Pattern matches existing refactored functions (getAllMatches, getUserLikes)
- Testing uses existing seed script (`npm run seed:test`)
- Atomic commit recommended for clean git history
