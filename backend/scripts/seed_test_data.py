import os
import random
import argparse
import bcrypt
import psycopg2
from psycopg2 import extras
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('PGHOST', 'localhost')
DB_PORT = os.getenv('PGPORT', '5432')
DB_NAME = os.getenv('PGDATABASE', 'mydb')
DB_USER = os.getenv('PGUSER', 'admin')
DB_PASS = os.getenv('PGPASSWORD', 'secret')

FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
    "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
    "Christopher", "Lisa", "Daniel", "Nancy", "Matthew", "Betty", "Anthony", "Sandra", "Mark", "Margaret",
    "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
]

CITIES = [
    {"name": "Paris", "lat": 48.8566, "lon": 2.3522},
    {"name": "Marseille", "lat": 43.2965, "lon": 5.3698},
    {"name": "Lyon", "lat": 45.7640, "lon": 4.8357},
    {"name": "Toulouse", "lat": 43.6047, "lon": 1.4442},
    {"name": "Nice", "lat": 43.7102, "lon": 7.2620},
    {"name": "Nantes", "lat": 47.2184, "lon": -1.5536},
    {"name": "Strasbourg", "lat": 48.5734, "lon": 7.7521},
    {"name": "Montpellier", "lat": 43.6108, "lon": 3.8767},
    {"name": "Bordeaux", "lat": 44.8378, "lon": -0.5792},
    {"name": "Lille", "lat": 50.6292, "lon": 3.0573},
    {"name": "Rennes", "lat": 48.1173, "lon": -1.6778},
    {"name": "Reims", "lat": 49.2583, "lon": 4.0317},
    {"name": "Saint-Étienne", "lat": 45.4397, "lon": 4.3872},
    {"name": "Le Havre", "lat": 49.4944, "lon": 0.1079},
    {"name": "Toulon", "lat": 43.1242, "lon": 5.9280},
    {"name": "Grenoble", "lat": 45.1885, "lon": 5.7245},
    {"name": "Dijon", "lat": 47.3220, "lon": 5.0415},
    {"name": "Angers", "lat": 47.4784, "lon": -0.5632},
    {"name": "Nîmes", "lat": 43.8367, "lon": 4.3601},
    {"name": "Villeurbanne", "lat": 45.7719, "lon": 4.8787}
]

TAG_NAMES = [
    "hiking", "books", "photography", "travel", "cooking", "music", "fitness", "art", "gaming", "movies",
    "coffee", "wine", "nature", "coding", "yoga", "dancing", "pets", "fashion", "foodie", "sports"
]

BIOS = [
    "Love exploring new places and trying out local food. Hiking is my therapy.",
    "Bookworm and coffee lover. Looking for someone to share a good story with.",
    "Photography enthusiast. I see beauty in everything. Let's capture some moments together.",
    "Travel addict. 30 countries and counting. Where to next?",
    "Food is my love language. I can cook a mean lasagna. Swipe right for recipes.",
    "Music is my life. Concerts are my happy place. Let's find a rhythm together.",
    "Gym rat and fitness freak. I believe in pushing limits. Looking for a workout buddy.",
    "Art is not what you see, but what you make others see. Creative soul searching for inspiration.",
    "Gamer at heart. RPGs are my favorite. Let's level up together.",
    "Movie buff. I can quote almost any 90s movie. Netflix and chill is overrated, let's go to the cinema.",
    "Always up for an adventure. Life is too short to stay in one place.",
    "Wine connoisseur. Let's share a bottle and some laughs.",
    "Nature lover. The mountains are calling and I must go.",
    "Software engineer by day, dreamer by night. I speak fluent sarcasm and Python.",
    "Yoga practitioner. Finding peace in the chaos of life.",
    "I love to dance like nobody is watching. Let's hit the dance floor.",
    "Dog person. My husky is my best friend. If my dog doesn't like you, it won't work.",
    "Fashion forward. I believe in style over trends. Let's dress up for no reason.",
    "Sushi lover. I could eat it every day. Join me for a platter?",
    "Basketball fan. I never miss a game. Let's shoot some hoops."
]

def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

def clear_data(cur):
    print("Clearing existing data...")
    cur.execute("TRUNCATE users, profiles, photos, tags, user_tags, likes, blocks RESTART IDENTITY CASCADE")

def seed_tags(cur, tag_names):
    print(f"Seeding {len(tag_names)} tags...")
    tags_data = [(name,) for name in tag_names]
    extras.execute_values(cur, "INSERT INTO tags (name) VALUES %s ON CONFLICT (name) DO NOTHING", tags_data)
    cur.execute("SELECT id, name FROM tags")
    return {row[1]: row[0] for row in cur.fetchall()}

def generate_users(num_users, verified_count):
    users = []
    password_hash = bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    for i in range(num_users):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        username = f"{first_name.lower()}{last_name.lower()}{i}"
        email = f"{username}@example.com"
        is_verified = i < verified_count
        
        users.append({
            "email": email,
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
            "password_hash": password_hash,
            "is_verified": is_verified,
            "completed_profile": i < (num_users * 0.7)
        })
    return users

def seed_users(cur, users):
    print(f"Seeding {len(users)} users...")
    user_insert_query = """
    INSERT INTO users (email, username, first_name, last_name, password_hash, is_verified, completed_profile)
    VALUES %s RETURNING id, username, completed_profile
    """
    user_data = [
        (u['email'], u['username'], u['first_name'], u['last_name'], u['password_hash'], u['is_verified'], u['completed_profile'])
        for u in users
    ]
    inserted_users = extras.execute_values(cur, user_insert_query, user_data, fetch=True)
    return inserted_users

def seed_profiles(cur, inserted_users):
    print(f"Seeding {len(inserted_users)} profiles...")
    profiles_data = []
    for user_id, username, completed in inserted_users:
        city = random.choice(CITIES)
        gender = random.choice(["male", "female", "other"])
        pref = random.choice(["male", "female", "both"])
        bio = random.choice(BIOS) if completed else None
        birth_date = date.today() - timedelta(days=random.randint(18*365, 65*365))
        
        profiles_data.append((
            user_id, gender, pref, bio, birth_date, 
            random.uniform(0, 100), city['lat'], city['lon'], city['name'], "France"
        ))
    
    profile_insert_query = """
    INSERT INTO profiles (user_id, gender, sexual_preference, biography, birth_date, fame_rating, latitude, longitude, city, country)
    VALUES %s
    """
    extras.execute_values(cur, profile_insert_query, profiles_data)

def seed_photos(cur, inserted_users):
    print("Seeding photos...")
    photos_data = []
    for user_id, username, completed in inserted_users:
        num_photos = random.randint(2, 5) if completed else random.randint(0, 2)
        for i in range(num_photos):
            photo_url = f"https://picsum.photos/seed/{username}_{i}/400/600"
            is_profile = (i == 0)
            photos_data.append((user_id, photo_url, is_profile))
    
    photo_insert_query = """
    INSERT INTO photos (user_id, photo_url, is_profile_picture)
    VALUES %s
    """
    extras.execute_values(cur, photo_insert_query, photos_data)

def seed_user_tags(cur, inserted_users, tag_map):
    print("Seeding user tags...")
    user_tags_data = []
    tag_ids = list(tag_map.values())
    for user_id, username, completed in inserted_users:
        num_tags = random.randint(3, 7) if completed else random.randint(0, 3)
        selected_tags = random.sample(tag_ids, min(num_tags, len(tag_ids)))
        for tag_id in selected_tags:
            user_tags_data.append((user_id, tag_id))
    
    user_tag_insert_query = "INSERT INTO user_tags (user_id, tag_id) VALUES %s"
    extras.execute_values(cur, user_tag_insert_query, user_tags_data)
    return len(user_tags_data)

def seed_interactions(cur, inserted_users):
    print("Seeding likes and blocks...")
    user_ids = [u[0] for u in inserted_users]
    likes_data = []
    blocks_data = []
    
    mutual_likes_count = 10
    for i in range(mutual_likes_count):
        u1, u2 = random.sample(user_ids, 2)
        likes_data.append((u1, u2))
        likes_data.append((u2, u1))
        
    for _ in range(20):
        u1, u2 = random.sample(user_ids, 2)
        likes_data.append((u1, u2))
        
    for _ in range(10):
        u1, u2 = random.sample(user_ids, 2)
        blocks_data.append((u1, u2))
        
    likes_insert_query = "INSERT INTO likes (liker_user_id, liked_user_id) VALUES %s"
    extras.execute_values(cur, likes_insert_query, likes_data)
    
    blocks_insert_query = "INSERT INTO blocks (blocker_user_id, blocked_user_id) VALUES %s"
    extras.execute_values(cur, blocks_insert_query, blocks_data)
    
    return len(likes_data), len(blocks_data)

def main():
    parser = argparse.ArgumentParser(description='Seed Matcha database with test data.')
    parser.add_argument('--users', type=int, default=50, help='Number of users to seed')
    parser.add_argument('--tags', type=int, default=20, help='Number of tags to seed')
    parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')
    parser.add_argument('--dry-run', action='store_true', help='Dry run (no database changes)')
    
    args = parser.parse_args()
    
    num_users = args.users
    verified_count = int(num_users * 0.6)
    unverified_count = num_users - verified_count
    
    conn = None
    try:
        if not args.dry_run:
            conn = get_connection()
            cur = conn.cursor()
            
            if args.clear:
                clear_data(cur)
            
            tag_map = seed_tags(cur, TAG_NAMES[:args.tags])
            users_to_seed = generate_users(num_users, verified_count)
            inserted_users = seed_users(cur, users_to_seed)
            seed_profiles(cur, inserted_users)
            seed_photos(cur, inserted_users)
            ut_count = seed_user_tags(cur, inserted_users, tag_map)
            likes_count, blocks_count = seed_interactions(cur, inserted_users)
            
            conn.commit()
            cur.close()
            
            print("╔════════════════════════════════════════════╗")
            print("║     TEST DATA SEEDED SUCCESSFULLY ✓       ║")
            print("├════════════════════════════════════════════┤")
            print(f"║ Users:        {num_users} ({verified_count} verified, {unverified_count} unverified)")
            print(f"║ Profiles:     {num_users}")
            print(f"║ Photos:       ~{num_users * 3}")
            print(f"║ Tags:         {len(tag_map)} unique")
            print(f"║ User-Tags:    ~{ut_count} associations")
            print(f"║ Likes:        {likes_count} (includes {10} mutual)")
            print(f"║ Blocks:       {blocks_count}")
            print("╚════════════════════════════════════════════╝")
        else:
            print("DRY RUN: No changes made to the database.")
            print(f"Would seed {num_users} users and associated data.")
            
    except Exception as e:
        print(f"An error occurred: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
