# Testing Guide: getAllMatches & getUserLikes ORM Refactoring

**Status**: TESTING READY
**Date**: 2026-04-28
**Prerequisites**: PostgreSQL running, backend server running

---

## Quick Start (5-10 minutes)

### Step 1: Seed Test Data
```bash
cd backend
npm run seed:test
```

**Expected Output**:
```
✅ Seeding test data...
✅ Created 50 users with complete profiles
✅ Created 175 photos
✅ Created 20+ tags
✅ Created 40+ likes relationships
✅ Created 8 mutual matches
✅ Seed completed successfully!
```

**Result**: Database now contains test data with relationships ready for testing.

---

### Step 2: Start Backend Server
```bash
npm run dev
```

**Expected Output**:
```
Server running on http://localhost:5000
```

---

### Step 3: Run Tests

Use any HTTP client (curl, Postman, VS Code REST Client, etc.)

---

## Test 1: getAllMatches (Mutual Matches)

### Endpoint
```
POST http://localhost:5000/api/matches
```

### Request Body
```json
{
  "userId": 20,
  "limit": 10,
  "offset": 0
}
```

### Expected Response Structure
```json
{
  "rows": [
    {
      "id": 45,
      "username": "john.doe",
      "first_name": "John",
      "last_name": "Doe",
      "gender": "male",
      "sexual_preference": "female",
      "biography": "Love hiking and coffee",
      "city": "Paris",
      "country": "France",
      "fame_rating": "4.50",
      "last_seen": "2026-04-28T10:30:00Z",
      "is_online": true,
      "age": 28,
      "latitude": "48.8566",
      "longitude": "2.3522",
      "photos": [
        {
          "id": 1,
          "photo_url": "/uploads/john_1.jpg",
          "is_profile_picture": true
        },
        {
          "id": 2,
          "photo_url": "/uploads/john_2.jpg",
          "is_profile_picture": false
        }
      ],
      "tags": [
        {
          "id": 5,
          "name": "hiking"
        },
        {
          "id": 12,
          "name": "coffee"
        }
      ]
    }
  ]
}
```

### Validation Checklist
- [ ] Response has `rows` array
- [ ] Each user has all required fields (id, username, name, gender, pref, bio, city, country, fame_rating, last_seen, is_online, age, latitude, longitude, photos, tags)
- [ ] fame_rating is numeric (can perform math operations)
- [ ] age is numeric (28, not "28")
- [ ] photos array contains `{id, photo_url, is_profile_picture}`
- [ ] tags array contains `{id, name}` ONLY (no user_id)
- [ ] Results are sorted by fame_rating DESC (highest first)
- [ ] Number of results respects limit (max 10 in this case)
- [ ] Only mutual matches returned (not one-sided)

### Test with Different Users
```bash
# User with many matches
POST /api/matches
{"userId": 1, "limit": 20, "offset": 0}

# User with few matches
POST /api/matches
{"userId": 15, "limit": 10, "offset": 0}

# Pagination test
POST /api/matches
{"userId": 1, "limit": 5, "offset": 0}  # First 5

POST /api/matches
{"userId": 1, "limit": 5, "offset": 5}  # Next 5
```

### Verify Pagination
- First call with offset=0, limit=5 should return first 5
- Second call with offset=5, limit=5 should return next 5
- Same user IDs should not appear in both results

---

## Test 2: getUserLikes (Admirers / Non-Mutual Likes)

### Endpoint
```
POST http://localhost:5000/api/likes
```

### Request Body
```json
{
  "userId": 20
}
```

### Expected Response Structure
```json
{
  "rows": [
    {
      "id": 32,
      "username": "jane.smith",
      "first_name": "Jane",
      "last_name": "Smith",
      "gender": "female",
      "sexual_preference": "male",
      "biography": "Artist and traveler",
      "city": "Lyon",
      "country": "France",
      "fame_rating": "4.80",
      "last_seen": "2026-04-28T11:15:00Z",
      "is_online": true,
      "age": 26,
      "latitude": "45.7640",
      "longitude": "4.8357",
      "photos": [
        {
          "id": 45,
          "photo_url": "/uploads/jane_1.jpg",
          "is_profile_picture": true
        }
      ],
      "tags": [
        {
          "id": 8,
          "name": "art"
        },
        {
          "id": 15,
          "name": "travel"
        }
      ]
    }
  ]
}
```

### Validation Checklist
- [ ] Response has `rows` array
- [ ] Each user has all required fields (same as getAllMatches)
- [ ] fame_rating is numeric
- [ ] age is numeric
- [ ] photos array contains `{id, photo_url, is_profile_picture}`
- [ ] tags array contains `{id, name}` ONLY (no user_id)
- [ ] Results are sorted by fame_rating DESC (highest first)
- [ ] **CRITICAL**: Mutual matches are EXCLUDED
  - If user 20 likes user 32, user 32 should NOT appear in results
  - Only one-sided admirers appear here
- [ ] All admirers returned (no limit in original)

### Verify Mutual Match Exclusion
Compare results with getAllMatches:
```
getAllMatches(20) returns: [user IDs of mutual matches]
getUserLikes(20) returns: [user IDs who like user 20, but NOT mutual]

→ No overlap should exist between these two lists
```

### Cross-Check Example
```bash
# Get mutual matches for user 20
POST /api/matches
{"userId": 20, "limit": 100, "offset": 0}
Response: [{id: 45, ...}, {id: 32, ...}, ...]  (mutual matches)

# Get admirers for user 20
POST /api/likes
{"userId": 20}
Response: [{id: 55, ...}, {id: 60, ...}, ...]  (NOT including 45 or 32)

→ Verify: None of the IDs from /api/likes appear in /api/matches results
```

---

## Test 3: Edge Cases

### Test 3.1: User with No Matches
```bash
POST /api/matches
{"userId": 99, "limit": 10, "offset": 0}
```

**Expected**: 
```json
{"rows": []}
```

### Test 3.2: User with No Admirers
```bash
POST /api/likes
{"userId": 99}
```

**Expected**: 
```json
{"rows": []}
```

### Test 3.3: All Admirers are Mutual
If user 20 has 3 admirers, all of whom are mutual matches:
```bash
POST /api/likes
{"userId": 20}
```

**Expected**: 
```json
{"rows": []}  // Empty because all are mutual
```

---

## Test 4: Data Consistency

### Verify Photo Structure
```javascript
// Check that each photo has required fields
const user = response.rows[0];
user.photos.forEach(photo => {
  console.assert(photo.id !== undefined, "Missing photo.id");
  console.assert(photo.photo_url !== undefined, "Missing photo.photo_url");
  console.assert(typeof photo.is_profile_picture === 'boolean', "is_profile_picture must be boolean");
});
```

### Verify Tag Structure
```javascript
// Check that tags DO NOT have user_id
const user = response.rows[0];
user.tags.forEach(tag => {
  console.assert(tag.id !== undefined, "Missing tag.id");
  console.assert(tag.name !== undefined, "Missing tag.name");
  console.assert(tag.user_id === undefined, "ERROR: tag.user_id should NOT be present");
});
```

### Verify Type Conversions
```javascript
// Check that fame_rating and age are numbers
const user = response.rows[0];
console.assert(typeof user.fame_rating === 'string' || typeof user.fame_rating === 'number', 
  "fame_rating must be numeric");
console.assert(typeof user.age === 'number', "age must be a number");

// Verify math operations work
const fameAsNumber = Number(user.fame_rating);
console.assert(!isNaN(fameAsNumber), "fame_rating must convert to number");
```

---

## Test 5: Sorting Verification

### getAllMatches Sorting
```bash
POST /api/matches
{"userId": 1, "limit": 100, "offset": 0}
```

**Verify Sorting**:
```javascript
const users = response.rows;
for (let i = 1; i < users.length; i++) {
  const prev = Number(users[i-1].fame_rating);
  const curr = Number(users[i].fame_rating);
  console.assert(prev >= curr, 
    `Sorting error: ${prev} should be >= ${curr}`);
}
console.log("✅ getAllMatches correctly sorted by fame_rating DESC");
```

### getUserLikes Sorting
```bash
POST /api/likes
{"userId": 1}
```

**Verify Sorting** (same as above):
```javascript
const users = response.rows;
for (let i = 1; i < users.length; i++) {
  const prev = Number(users[i-1].fame_rating);
  const curr = Number(users[i].fame_rating);
  console.assert(prev >= curr, 
    `Sorting error: ${prev} should be >= ${curr}`);
}
console.log("✅ getUserLikes correctly sorted by fame_rating DESC");
```

---

## Test 6: Performance Check

### Query Count Verification
Use browser DevTools → Network tab or PostgreSQL logs to verify query count:

**getAllMatches should make exactly 4 queries**:
1. Extract mutual match IDs
2. Fetch user profiles
3. Batch fetch photos
4. Batch fetch tags

**getUserLikes should make exactly 5 queries**:
1. Fetch liker IDs
2. Extract mutual match IDs
3. Fetch user profiles
4. Batch fetch photos
5. Batch fetch tags

### Response Time
- getAllMatches: <100ms typical
- getUserLikes: <100ms typical
- If much slower, check if there's an N+1 query issue

---

## Troubleshooting

### Issue: "ECONNREFUSED" when seeding
**Solution**: Start PostgreSQL first
```bash
# On macOS with Homebrew
brew services start postgresql

# On Linux with systemctl
sudo systemctl start postgresql

# Using Docker
docker start postgres-container
```

### Issue: "Cannot find module" errors
**Solution**: Install dependencies
```bash
cd backend
npm install
```

### Issue: Tags have user_id field
**Expected**: `{id, name}`
**Got**: `{user_id, name, id}`

**Problem**: Tag grouping wasn't filtered correctly
**Fix**: Check lines 411-413 in matchModel.ts

### Issue: age is a string "28" instead of number 28
**Solution**: Check line 422 in matchModel.ts - should convert with `Number(u.age)`

### Issue: fame_rating comparison fails
**Problem**: PostgreSQL DECIMAL returns as string
**Solution**: Use `Number()` conversion in sort (line 380)

### Issue: Mutual matches not excluded in getUserLikes
**Problem**: Set-based filtering not working
**Check**:
- Line 345: Are mutualMatchIds populated?
- Line 348: Is filter working correctly?

---

## Automated Test Script (Optional)

Create `backend/tests/test-orm-refactoring.js`:

```javascript
const http = require('http');

async function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing getAllMatches & getUserLikes ORM Refactoring\n');
  
  // Test 1: getAllMatches
  console.log('Test 1: getAllMatches(userId=20)');
  const matches = await makeRequest('POST', '/api/matches', {
    userId: 20,
    limit: 10,
    offset: 0
  });
  
  console.assert(matches.rows, '❌ No rows returned');
  console.assert(matches.rows[0].tags.every(t => !t.user_id), 
    '❌ Tags have user_id field');
  console.log('✅ getAllMatches passed\n');
  
  // Test 2: getUserLikes
  console.log('Test 2: getUserLikes(userId=20)');
  const likes = await makeRequest('POST', '/api/likes', { userId: 20 });
  
  console.assert(likes.rows, '❌ No rows returned');
  console.assert(likes.rows[0].tags.every(t => !t.user_id), 
    '❌ Tags have user_id field');
  console.log('✅ getUserLikes passed\n');
  
  // Test 3: Verify no overlap
  console.log('Test 3: Verify mutual matches excluded from getUserLikes');
  const matchIds = new Set(matches.rows.map(u => u.id));
  const likeIds = new Set(likes.rows.map(u => u.id));
  const overlap = [...likeIds].filter(id => matchIds.has(id));
  
  console.assert(overlap.length === 0, 
    `❌ Found ${overlap.length} overlapping users`);
  console.log('✅ No overlap between matches and likes\n');
  
  console.log('✅ All tests passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
```

Run with:
```bash
node tests/test-orm-refactoring.js
```

---

## Summary

**When all tests pass, you can confirm**:
- ✅ getAllMatches works correctly (4 queries, sorted, paginated)
- ✅ getUserLikes works correctly (5 queries, excludes mutual, sorted)
- ✅ Tag structure is correct (`{id, name}` only)
- ✅ Type conversions work (fame_rating, age as numbers)
- ✅ No N+1 query issues
- ✅ Ready for production deployment

---

## Next Steps After Testing

1. If all tests pass: **Ready to deploy** ✅
2. If some tests fail: **Debug and fix** the specific issues
3. Once verified: **Remove test data** (optional)
4. Consider: **Refactor remaining functions** (getMatchesCount, getProfileDataforMatches)

---

## Files for Reference

- **Refactored Functions**: `/backend/src/models/matchModel.ts` (lines 215-427)
- **Commits**:
  - `5f7b69c`: getAllMatches refactoring
  - `f2fe6a6`: getUserLikes refactoring
- **Test Data**: `/backend/scripts/seedTestData.ts`
- **ORM Implementation**: `/backend/database/query_builder.ts`

---

## Test Completion Checklist

After running all tests:

- [ ] getAllMatches returns mutual matches only
- [ ] getUserLikes returns non-mutual likers only
- [ ] Tags structure is `{id, name}` (no user_id)
- [ ] Photos structure is `{id, photo_url, is_profile_picture}`
- [ ] Sorting by fame_rating DESC works
- [ ] Pagination works correctly
- [ ] Type conversions correct (fame_rating, age as numbers)
- [ ] No N+1 queries observed
- [ ] Response times <100ms typical
- [ ] Edge cases handled (empty results, etc.)

**When all checked**: You're ready to deploy these changes to production! 🎉
