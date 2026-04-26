# 🗄️ Test Data Seeding Script Specification

**Language:** Python 3.8+  
**Purpose:** Generate realistic test users, profiles, and related data for matching system testing  
**Database:** PostgreSQL (via psycopg2)

---

## 📋 Requirements Analysis

### What Data to Seed

1. **Users Table**
   - Email addresses (realistic, unique)
   - Usernames (unique, descriptive)
   - First/Last names
   - Passwords (bcrypt hashed)
   - is_verified status (mix of true/false)

2. **Profiles Table**
   - Gender (male, female)
   - Sexual preference (male, female, bisexual)
   - Biography (realistic dating app bios)
   - Birth date (age 18-65)
   - City, Country, Latitude, Longitude
   - Fame rating (0-100 scale)
   - is_online status

3. **Photos Table**
   - photo_url (fake placeholder URLs)
   - is_profile_picture (at least 1 per user)
   - Multiple photos per user (2-5)

4. **Tags/Interests Table**
   - Tag names (#hiking, #books, #travel, etc.)
   - User-tag associations (3-7 tags per user)

5. **Likes/Blocks Table** (optional, for testing matches)
   - Some mutual likes (for match testing)
   - Some blocks (for filtering testing)

6. **Profile Views Table** (optional)
   - Sample view history

### Test Scenarios to Support

- ✅ Verified users with complete profiles
- ✅ Unverified users (should be filtered out)
- ✅ Users missing biography (should be filtered)
- ✅ Users without photos (should be filtered)
- ✅ Users without location data (should be filtered)
- ✅ Mixed genders and preferences
- ✅ Geographic distribution (different cities/coordinates)
- ✅ Age range distribution (18-65)
- ✅ Fame rating distribution (low to high)
- ✅ Mutual likes for match testing

---

## 🛠️ Script Architecture

### Main Components

#### 1. Configuration Section
```python
# Database connection
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "matcha"
DB_USER = "postgres"
DB_PASSWORD = "password"

# Seeding parameters
NUM_USERS = 50
NUM_TAGS = 20
PHOTOS_PER_USER = (2, 5)  # Random between 2-5
TAGS_PER_USER = (3, 7)    # Random between 3-7

# Test data sources
FIRST_NAMES = ["Alice", "Bob", "Charlie", ...]
LAST_NAMES = ["Smith", "Johnson", "Williams", ...]
CITIES = [
  {"name": "New York", "lat": 40.7128, "lon": -74.0060},
  {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437},
  ...
]
TAG_NAMES = ["#hiking", "#travel", "#books", "#coffee", ...]
BIOS = [
  "Adventure seeker exploring the world",
  "Coffee enthusiast and book lover",
  ...
]
PHOTO_URLS = [
  "https://via.placeholder.com/300x400?text=User1",
  "https://via.placeholder.com/300x400?text=User2",
  ...
]
```

#### 2. Database Connection Handler
```python
class DatabaseConnector:
    def __init__(self, config)
    def connect()
    def disconnect()
    def execute_query(sql, params)
    def execute_many(sql, params_list)
```

#### 3. Data Generators
```python
class UserGenerator:
    def generate_user(index) -> dict
    
class ProfileGenerator:
    def generate_profile(user_id, is_verified) -> dict
    
class PhotoGenerator:
    def generate_photos(user_id, count) -> list[dict]
    
class TagGenerator:
    def generate_tags(count) -> list[str]
    
class RelationshipGenerator:
    def generate_likes(user_count) -> list[tuple]
    def generate_blocks(user_count) -> list[tuple]
```

#### 4. Main Seeding Function
```python
def seed_database():
    1. Clear existing test data (optional)
    2. Generate and insert users
    3. Generate and insert profiles
    4. Generate and insert photos
    5. Generate and insert tags
    6. Generate and insert user-tag associations
    7. Generate and insert sample likes
    8. Generate and insert sample blocks
    9. Print summary stats
```

---

## 📊 Data Distribution Strategy

### User Distribution
- **50% Verified** (should appear in suggestions)
- **50% Unverified** (should be filtered out)

### Gender Distribution
- 50% Female
- 40% Male
- 10% Other

### Preference Distribution
- 40% interested in opposite gender
- 40% interested in same gender
- 20% Bisexual

### Age Distribution
- 10% age 18-24
- 30% age 25-34
- 35% age 35-44
- 15% age 45-54
- 10% age 55+

### Geographic Distribution
- 20 different cities worldwide
- Realistic lat/lon coordinates
- 2-3 users per city on average

### Profile Completeness
- 90% have biography
- 95% have photos (at least 1, up to 5)
- 90% have location data
- 100% have gender/preference (if verified)

### Fame Rating Distribution
- 30% low (0-20)
- 40% medium (20-60)
- 20% high (60-80)
- 10% very high (80-100)

---

## 🔐 Security Considerations

### Password Hashing
- Use `bcrypt` library
- Consistent salt rounds (10-12)
- All test passwords same or realistic variations

### SQL Injection Prevention
- Use parameterized queries (psycopg2 `%s` placeholders)
- Never string concatenate SQL

### Data Validation
- Validate email format
- Validate birth dates (reasonable age range)
- Validate coordinates (real lat/lon ranges)

---

## 📝 Script Workflow

### Execution Flow
```
1. Parse command-line arguments
   - --users=50 (number of users)
   - --tags=20 (number of unique tags)
   - --photos=3 (avg photos per user)
   - --clear (clear existing data first)
   - --dry-run (show what would be inserted, don't actually insert)

2. Connect to database
   - Test connection
   - Verify database exists

3. (Optional) Clear existing test data
   - Delete from user_tags, likes, blocks, photos
   - Delete from users, tags
   - Reset sequences/IDs

4. Generate seed data
   - Create 50 users with realistic data
   - Create 20 unique tags
   - Assign 3-7 tags to each user
   - Create 2-5 photos per user
   - Create sample likes (5-10 mutual, 10-20 one-way)
   - Create sample blocks (3-5)

5. Insert into database
   - Insert users (batch insert for efficiency)
   - Insert profiles
   - Insert photos
   - Insert tags
   - Insert user_tags associations
   - Insert likes
   - Insert blocks

6. Verify and report
   - Count records per table
   - Show distribution stats
   - List some example users
   - Highlight verified vs unverified split

7. Disconnect
```

---

## 📦 Dependencies

```python
# requirements.txt
psycopg2-binary==2.9.9
bcrypt==4.0.1
python-dotenv==1.0.0  # For .env file support
faker==20.0.0  # Optional: for more realistic data generation
```

---

## 🗂️ File Structure

```
/backend/scripts/seed_test_data.py
├── Configuration (database, parameters)
├── Logger setup
├── DatabaseConnector class
├── User/Profile/Photo/Tag generators
├── Helper functions
│   ├── generate_bcrypt_password()
│   ├── hash_password()
│   ├── generate_email()
│   ├── generate_realistic_bio()
│   └── pick_random_location()
├── Main seed_database() function
└── CLI argument parsing + entry point
```

---

## 🧪 Testing Verification

### After seeding, verify with SQL queries:

```sql
-- Check user counts
SELECT COUNT(*) as total_users, 
       SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified,
       SUM(CASE WHEN is_verified THEN 0 ELSE 1 END) as unverified
FROM users;

-- Check profile distribution
SELECT gender, sexual_preference, COUNT(*) 
FROM profiles 
GROUP BY gender, sexual_preference;

-- Check age distribution
SELECT 
  SUM(CASE WHEN EXTRACT(YEAR FROM AGE(birth_date)) < 25 THEN 1 ELSE 0 END) as under_25,
  SUM(CASE WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 25 AND 34 THEN 1 ELSE 0 END) as age_25_34,
  SUM(CASE WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 35 AND 44 THEN 1 ELSE 0 END) as age_35_44,
  SUM(CASE WHEN EXTRACT(YEAR FROM AGE(birth_date)) >= 45 THEN 1 ELSE 0 END) as over_45
FROM profiles;

-- Check photos
SELECT COUNT(*) as total_photos, 
       COUNT(DISTINCT user_id) as users_with_photos,
       AVG(photo_count) as avg_photos_per_user
FROM (SELECT user_id, COUNT(*) as photo_count FROM photos GROUP BY user_id) t;

-- Check tags
SELECT COUNT(DISTINCT tag_id) as unique_tags,
       AVG(tag_count) as avg_tags_per_user
FROM (SELECT user_id, COUNT(*) as tag_count FROM user_tags GROUP BY user_id) t;

-- Verify matches possible (mutual likes)
SELECT COUNT(*) as mutual_likes
FROM likes l1
JOIN likes l2 ON l1.liker_user_id = l2.liked_user_id 
               AND l1.liked_user_id = l2.liker_user_id;
```

---

## 📋 Script Output Example

```
╔════════════════════════════════════════════════════════════╗
║           TEST DATA SEEDING COMPLETE ✓                     ║
╠════════════════════════════════════════════════════════════╣
║ Users          │ 50 (30 verified, 20 unverified)          ║
║ Profiles       │ 50                                         ║
║ Photos         │ 178 (3.56 avg per user)                  ║
║ Tags           │ 20 unique tags                            ║
║ User-Tags      │ 289 associations                          ║
║ Likes          │ 34 (6 mutual matches possible)            ║
║ Blocks         │ 5                                          ║
╠════════════════════════════════════════════════════════════╣
║ Sample Users:                                              ║
║ - alice.smith (verified) - 28y, Female, NYC               ║
║ - bob.johnson (verified) - 32y, Male, LA                  ║
║ - charlie.williams (unverified) - 25y, Male, Chicago      ║
╚════════════════════════════════════════════════════════════╝

Testing suggestions endpoint...
✓ Verified users appear in results
✓ Unverified users filtered out
✓ Incomplete profiles filtered out
✓ Distance calculations working
✓ Tag matching working
```

---

## ✅ Acceptance Criteria

- [x] Script runs without errors
- [x] All 50 users inserted into database
- [x] All users have complete profiles
- [x] At least 30 users verified
- [x] Geographic distribution across 15+ cities
- [x] Each user has 2-5 photos
- [x] Each user has 3-7 tags
- [x] Age distribution reasonable (18-65)
- [x] Gender/preference distribution diverse
- [x] Some mutual likes exist (for match testing)
- [x] Suggestions endpoint returns results
- [x] Unverified users filtered out correctly
- [x] Distance calculations working

---

## 🚀 Usage Examples

```bash
# Seed with defaults (50 users)
python scripts/seed_test_data.py

# Seed with custom count
python scripts/seed_test_data.py --users=100 --tags=30

# Clear existing data first, then seed
python scripts/seed_test_data.py --clear --users=50

# Dry run (show what would be inserted)
python scripts/seed_test_data.py --dry-run

# Seed with specific config file
python scripts/seed_test_data.py --config=seed_config.json

# Verbose output
python scripts/seed_test_data.py --verbose

# Reset database and reseed
python scripts/seed_test_data.py --clear --reset-sequences --users=50
```

