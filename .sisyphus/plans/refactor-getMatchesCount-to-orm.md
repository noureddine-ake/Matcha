# Refactor getMatchesCount to Use ORM Instead of Raw SQL

**Status**: PLAN READY
**Created**: 2026-04-28
**Priority**: LOW (simple COUNT, not critical path)
**Estimated Duration**: 15-20 minutes
**Complexity**: Very Low (single simple query)

---

## Executive Summary

The `getMatchesCount()` function in `backend/src/models/matchModel.ts` (lines 434-446) currently uses raw SQL to count mutual matches for a user.

**Goal**: Refactor to use ORM pattern, completing 100% ORM migration of matchModel.

**Why**: 
- Consistency: Last remaining raw SQL function in entire file
- Simplicity: Very straightforward COUNT query
- Pattern Completion: Achieve full ORM migration

---

## Current Implementation Analysis

**Raw SQL Query** (lines 435-442):
```sql
SELECT COUNT(*)::int AS total_matches
FROM likes l1
JOIN likes l2 
  ON l1.liker_user_id = l2.liked_user_id
  AND l1.liked_user_id = l2.liker_user_id
WHERE l1.liker_user_id = $1
```

**Current Issues**:
- ❌ Uses raw SQL (not ORM)
- ❌ Returns count via pool.query

**What Works**:
- ✅ Logic is correct (mutual match count)

---

## Implementation Plan

### Phase 1: Count Mutual Matches via ORM

**Task 1.1**: Use Likes ORM to count mutual matches
```typescript
const result = await Likes.select(['COUNT(*) as total_matches'])
  .from('likes l1')
  .join('INNER', 'likes l2', 'l1.liker_user_id = l2.liked_user_id AND l1.liked_user_id = l2.liker_user_id')
  .where('l1.liker_user_id', userId)
  .run();

return parseInt(result.rows[0].total_matches) || 0;
```

---

## Validation Criteria

- [ ] Returns integer count (not object)
- [ ] Count matches mutual matches only
- [ ] Returns 0 if no matches

---

## Expected Output

```
// User with 3 mutual matches
3

// User with no matches  
0
```

---

## Files to Modify

1. **Primary**: `backend/src/models/matchModel.ts` (getMatchesCount function, lines 434-446)
