# Refactor getProfileDataforMatches to Use ORM Instead of Raw SQL

**Status**: PLAN READY
**Created**: 2026-04-28
**Priority**: LOW (metadata fetch, not critical path)
**Estimated Duration**: 20-30 minutes
**Complexity**: Low (simple metadata aggregation)

---

## Executive Summary

The `getProfileDataforMatches()` function in `backend/src/models/matchModel.ts` (lines 305-323) currently uses raw SQL to fetch profile metadata and tag IDs for a given user.

**Goal**: Refactor to use ORM pattern, completing 100% ORM migration of matchModel.

**Why**: 
- Consistency: Last metadata function using raw SQL
- Maintainability: Simple function, easy to refactor
- Pattern Completion: Achieve full ORM migration

---

## Current Implementation Analysis

**Raw SQL Query** (lines 306-319):
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

**Current Issues**:
- ❌ Uses raw SQL (not ORM)
- ❌ array_agg (PostgreSQL specific)
- ❌ GROUP BY with array aggregation

**What Works**:
- ✅ Returns profile data correctly
- ✅ Returns tag IDs as array

---

## Implementation Plan

### Phase 1: Fetch Profile Data

**Task 1.1**: Get profile for user with ORM
```typescript
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
```

---

### Phase 2: Fetch Tag IDs

**Task 2.1**: Get all tag IDs for user
```typescript
const userTagsResult = await UserTags.select(['tag_id'])
  .where('user_id', userId)
  .run();

const tagIds = userTagsResult.rows.map((t: any) => t.tag_id);
```

---

### Phase 3: Combine Data

**Task 3.1**: Return combined response
```typescript
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
```

---

## Validation Criteria

- [ ] Returns same structure as before: `{rows: [...]}`
- [ ] Profile data complete: gender, sexual_preference, latitude, longitude, birth_date
- [ ] Tag IDs returned as array: user_tag_ids: [1, 5, 12, ...]
- [ ] Handles missing profile (returns empty)
- [ ] No N+1 queries (2 queries max)

---

## Expected Output

```json
{
  "rows": [{
    "gender": "female",
    "sexual_preference": "male",
    "latitude": "48.8566",
    "longitude": "2.3522",
    "birth_date": "1995-03-15T00:00:00Z",
    "user_tag_ids": [1, 5, 12, 18]
  }]
}
```

---

## Files to Modify

1. **Primary**: `backend/src/models/matchModel.ts` (getProfileDataforMatches function, lines 305-323)
