import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "mydb",
  password: "secret",
  port: 5432,
});

async function seed() {
  try {
    // Clear old data (optional)
    await pool.query(`
      DELETE FROM user_tags;
      DELETE FROM tags;
      DELETE FROM profiles;
      DELETE FROM users;
    `);

    console.log("🧹 Old data cleared");

    // Insert users
    const users = [
      ["alice@example.com", "alice", "$2b$10$abcdef123456abcdef1234abcd123456abcdef123456abcdef12", true, true],
      ["bob@example.com", "bob", "$2b$10$abcdef123456abcdef1234abcd123456abcdef123456abcdef12", true, true],
      ["charlie@example.com", "charlie", "$2b$10$abcdef123456abcdef1234abcd123456abcdef123456abcdef12", false, false],
      ["diana@example.com", "diana", "$2b$10$abcdef123456abcdef1234abcd123456abcdef123456abcdef12", true, false],
    ];

    const userInsertPromises = users.map((u) =>
      pool.query(
        `INSERT INTO users (email, username, password_hash, is_verified, completed_profile)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id;`,
        u
      )
    );

    const userResults = await Promise.all(userInsertPromises);
    const userIds = userResults.map((res) => res.rows[0].id);
    console.log("✅ Users inserted:", userIds);

    // Insert profiles
    const profiles = [
      [userIds[0], 87.45, 48.8566, 2.3522, "Paris", "France", true],
      [userIds[1], 64.32, 51.5074, -0.1278, "London", "UK", false],
      [userIds[2], 43.21, 40.7128, -74.006, "New York", "USA", true],
      [userIds[3], 70.1, 35.6895, 139.6917, "Tokyo", "Japan", false],
    ];

    for (const p of profiles) {
      await pool.query(
        `INSERT INTO profiles (user_id, fame_rating, latitude, longitude, city, country, is_online, last_seen)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());`,
        p
      );
    }
    console.log("✅ Profiles inserted");

    // Insert tags
    const tags = ["Music", "Travel", "Photography", "Cooking", "Sports", "Reading", "Gaming", "Fitness"];
    const tagResults = [];
    for (const t of tags) {
      const res = await pool.query(
        `INSERT INTO tags (name, created_at) VALUES ($1, NOW()) RETURNING id;`,
        [t]
      );
      tagResults.push(res.rows[0].id);
    }
    console.log("✅ Tags inserted:", tagResults);

    // Insert user_tags
    const userTags = [
      [userIds[0], [tagResults[0], tagResults[1], tagResults[2]]], // Alice
      [userIds[1], [tagResults[3], tagResults[4]]],               // Bob
      [userIds[2], [tagResults[5], tagResults[0], tagResults[6]]],// Charlie
      [userIds[3], [tagResults[7], tagResults[1]]],               // Diana
    ];

    for (const [userId, tagList] of userTags) {
      for (const tagId of tagList) {
        await pool.query(`INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2);`, [userId, tagId]);
      }
    }
    console.log("✅ User tags inserted");

    console.log("🎉 Database successfully seeded!");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await pool.end();
  }
}

seed();
