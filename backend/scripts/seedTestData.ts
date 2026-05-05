import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


const { Pool } = pkg;
const pool = new Pool({
  user: process.env.PGUSER,
  host: 'localhost',
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: 5431,
});

// Command line arguments
const args = process.argv.slice(2);
const numUsers = parseInt(args.find(arg => arg.startsWith('--users='))?.split('=')[1] || '550');
const clearData = args.includes('--clear');
const dryRun = args.includes('--dry-run');

// Data for generation
const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Lucas', 'Mia', 'Mason',
  'Isabella', 'Logan', 'Charlotte', 'Oliver', 'Amelia', 'Elijah', 'Harper', 'Aiden', 'Evelyn', 'James',
  'Abigail', 'Benjamin', 'Emily', 'Sebastian', 'Elizabeth', 'Jack', 'Sofia', 'Alexander', 'Avery', 'William',
  'Ella', 'Michael', 'Scarlett', 'Daniel', 'Madison', 'Henry', 'Chloe', 'Owen', 'Victoria', 'Wyatt',
  'Thomas', 'Camille', 'Antoine', 'Léa', 'Julien', 'Manon', 'Nicolas', 'Inès', 'Hugo', 'Sarah',
  'Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah', 'Isaac', 'Julia',
  'Kevin', 'Laura', 'Matthew', 'Natalie', 'Oscar', 'Patricia', 'Quincy', 'Rachel', 'Samuel', 'Tina',
  'Ulysses', 'Violet', 'Walter', 'Xena', 'Yuki', 'Zachary', 'Abigail', 'Bradley', 'Casey', 'Devon',
  'Ethan', 'Fiona', 'Gabriel', 'Hazel', 'Ivan', 'Jacqueline', 'Keith', 'Lillian', 'Milo', 'Natalie',
  'Oliver', 'Piper', 'Quinn', 'Rosa', 'Sam', 'Taylor', 'Uma', 'Victor', 'Whitney', 'Xavier',
  'Yara', 'Zoe', 'Aaron', 'Bella', 'Clark', 'Diana', 'Ezra', 'Faith', 'Grace', 'Henry',
  'Iris', 'Jake', 'Kate', 'Leo', 'Molly', 'Nora', 'Owen', 'Poppy', 'Riley', 'Stella',
  'Theo', 'Uma', 'Vincent', 'Wendy', 'Xander', 'Yasmin', 'Zeke', 'Ava', 'Aiden', 'Amelia'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon',
  'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel',
  'Girard', 'Andre', 'Legrand', 'Garnier', 'Favre', 'Rousseau', 'Blanc', 'Guerin', 'Boyer', 'Hubert',
  'Renard', 'Gillet', 'Deschamps', 'Perrin', 'Renaud', 'Gendron', 'Guillot', 'Benard', 'Bourgeois', 'Chevallier',
  'Coleman', 'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flowers', 'Parks', 'Payne',
  'Cunningham', 'Pierce', 'Curry', 'Pace', 'Pierce', 'Salazar', 'Salinas', 'Salmons', 'Sample', 'Samuel',
  'Sanders', 'Sanderson', 'Sandifer', 'Sandlin', 'Sanford', 'Santiago', 'Santos', 'Sankey', 'Sargent', 'Sargis',
  'Sato', 'Sauceda', 'Sauer', 'Saulsbury', 'Saunders', 'Sauvage', 'Savage', 'Savalla', 'Savannah', 'Savery',
  'Savidge', 'Savill', 'Saville', 'Savitzky', 'Savoy', 'Sawaya', 'Sawbridge', 'Sawers', 'Sawicki', 'Sawicky'
];

const cities = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
  { name: 'Lyon', lat: 45.7640, lng: 4.8357 },
  { name: 'Toulouse', lat: 43.6047, lng: 1.4442 },
  { name: 'Nice', lat: 43.7102, lng: 7.2620 },
  { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
  { name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
  { name: 'Montpellier', lat: 43.6108, lng: 3.8767 },
  { name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
  { name: 'Lille', lat: 50.6292, lng: 3.0573 },
  { name: 'Rennes', lat: 48.1173, lng: -1.6778 },
  { name: 'Reims', lat: 49.2583, lng: 4.0317 },
  { name: 'Saint-Étienne', lat: 45.4397, lng: 4.3873 },
  { name: 'Le Havre', lat: 49.4944, lng: 0.1079 },
  { name: 'Toulon', lat: 43.1242, lng: 5.9280 },
  { name: 'Grenoble', lat: 45.1885, lng: 5.7245 },
  { name: 'Dijon', lat: 47.3220, lng: 5.0415 },
  { name: 'Angers', lat: 47.4784, lng: -0.5632 },
  { name: 'Nîmes', lat: 43.8367, lng: 4.3601 },
  { name: 'Villeurbanne', lat: 45.7719, lng: 4.8842 },
  { name: 'Aix-en-Provence', lat: 43.5298, lng: 5.4474 },
  { name: 'Brest', lat: 48.3905, lng: -4.4860 },
  { name: 'Havre', lat: 49.4944, lng: 0.1079 },
  { name: 'Saint-Denis', lat: 48.9352, lng: 2.3597 },
  { name: 'Bethune', lat: 50.5239, lng: 2.6359 },
  { name: 'Orleans', lat: 47.9029, lng: 1.9090 },
  { name: 'Amiens', lat: 49.8941, lng: 2.2959 },
  { name: 'Limoges', lat: 45.8336, lng: 1.2611 },
  { name: 'Rouen', lat: 49.4432, lng: 1.0993 },
  { name: 'Lens', lat: 50.4263, lng: 2.8217 },
  { name: 'Saint-Quentin', lat: 49.8507, lng: 3.2833 },
  { name: 'Saint-Paul', lat: 48.9511, lng: 2.2511 },
  { name: 'Villepinte', lat: 48.9703, lng: 2.5593 },
  { name: 'Argenteuil', lat: 48.9483, lng: 2.2162 },
  { name: 'Montreuil', lat: 48.8626, lng: 2.4424 },
  { name: 'Créteil', lat: 48.7798, lng: 2.4549 },
  { name: 'Nanterre', lat: 48.8966, lng: 2.2250 },
  { name: 'Metz', lat: 49.1193, lng: 6.1757 },
  { name: 'Mulhouse', lat: 47.7412, lng: 7.3191 },
  { name: 'Thionville', lat: 49.3603, lng: 6.1650 }
];

const tags = [
  '#travel', '#music', '#fitness', '#foodie', '#coding', '#photography', '#art', '#movies', '#books', '#gaming',
  '#nature', '#sports', '#coffee', '#fashion', '#cooking', '#dance', '#yoga', '#hiking', '#wine', '#pets'
];

const bios = [
  'Passionate about life and new adventures. Looking for someone to share good times with.',
  'Software engineer by day, amateur chef by night. I love exploring new cities.',
  'Fitness enthusiast and nature lover. Always up for a hike or a run.',
  'Bookworm and coffee addict. Tell me about your favorite novel.',
  'Traveling the world one city at a time. Looking for a travel buddy.',
  'Music is my life. Let’s go to a concert together!',
  'Foodie at heart. I know all the best spots for brunch.',
  'Artist and dreamer. I find beauty in everything.',
  'Gamer and tech geek. Looking for player 2.',
  'Yoga practitioner and meditation fan. Seeking balance and harmony.',
  'Life is short, make it sweet. Big fan of desserts and long walks.',
  'Just a guy/girl looking for a meaningful connection.',
  'I love dogs more than people. If you have a pet, we will get along.',
  'Adventurous soul. Skydiving and surfing are on my bucket list.',
  'Movie buff. I can quote almost any 90s comedy.',
  'Photography is how I see the world. Check out my shots.',
  'Sports fan. I never miss a match of my favorite team.',
  'Dancing under the stars is my idea of a perfect night.',
  'Wine tasting and good conversations. That’s my vibe.',
  'Living my best life. Join me?',
  'Introvert who can be extroverted with the right person.',
  'Looking for someone to go to the museum with.',
  'Sucker for a good laugh. Sarcasm is my second language.',
  'Always learning, always growing.',
  'Sunsets and deep talks.',
  'I make a mean lasagna. Change my mind.',
  'Volunteer and social activist. I care about the world.',
  'Minimalist lifestyle lover.',
  'History buff. Ask me about the Roman Empire.',
  'Fluent in Emoji and bad jokes.'
];

const placeholderPhotos = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c',
  'https://images.unsplash.com/photo-1554151228-14d9def656e4',
  'https://images.unsplash.com/photo-1491349174775-aaafddd81942',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36'
];

async function seed() {
  console.log('🚀 Starting test data seeding...');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN enabled. Simulating database operations...');
    const numVerified = Math.floor(numUsers * 0.6);
    const userIds = Array.from({ length: numUsers }, (_, i) => i + 1);
    const tagsCount = tags.length;
    const numLikes = 40;
    const numMatches = 8;
    const numBlocks = 8;

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║     TEST DATA SEEDED SUCCESSFULLY ✓       ║');
    console.log('├════════════════════════════════════════════┤');
    console.log(`║ Users:        ${numUsers} (${numVerified} verified, ${numUsers - numVerified} unverified)`);
    console.log(`║ Profiles:     ${userIds.length}`);
    console.log(`║ Photos:       ~${userIds.length * 3.5} (avg 3.5/user)`);
    console.log(`║ Tags:         ${tagsCount} unique`);
    console.log(`║ Likes:        ${numLikes} (includes ${numMatches} mutual matches)`);
    console.log(`║ Blocks:       ${numBlocks}`);
    console.log('╚════════════════════════════════════════════╝\n');
    return;
  }

  const client = await pool.connect();
  
  try {
    if (!dryRun && clearData) {
      console.log('🧹 Clearing existing data...');
      await client.query('TRUNCATE users CASCADE');
      await client.query('TRUNCATE tags CASCADE');
    }

    // Seed Tags
    console.log('🏷️  Seeding tags...');
    const tagIds = [];
    for (const tagName of tags) {
      if (!dryRun) {
        const res = await client.query(
          'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
          [tagName]
        );
        tagIds.push(res.rows[0].id);
      } else {
        tagIds.push(Math.floor(Math.random() * 1000));
      }
    }

    const passwordHash = await bcrypt.hash('Password123!', 10);
    const userIds = [];
    const numVerified = Math.floor(numUsers * 0.6);
    
    console.log(`👤 Seeding ${numUsers} users...`);
    
    for (let i = 0; i < numUsers; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Math.floor(Math.random() * 10000)}`;
      const email = `${username}@example.com`;
      const isVerified = i < numVerified;
      const completedProfile = Math.random() > 0.1; // 90% have completed profile

      let userId;
      if (!dryRun) {
        const userRes = await client.query(
          'INSERT INTO users (email, username, first_name, last_name, password_hash, is_verified, completed_profile) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [email, username, firstName, lastName, passwordHash, isVerified, completedProfile]
        );
        userId = userRes.rows[0].id;
      } else {
        userId = i + 1;
      }
      userIds.push(userId);

      if (completedProfile) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const pref = Math.random() > 0.7 ? 'both' : (gender === 'male' ? 'female' : 'male');
        const bio = bios[Math.floor(Math.random() * bios.length)];
        const birthDate = new Date();
        birthDate.setFullYear(birthDate.getFullYear() - (18 + Math.floor(Math.random() * 47)));
        
        if (!dryRun) {
          await client.query(
            'INSERT INTO profiles (user_id, gender, sexual_preference, biography, birth_date, city, country, latitude, longitude, fame_rating) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [userId, gender, pref, bio, birthDate, city.name, 'France', city.lat, city.lng, Math.random() * 5]
          );

          // Seed user-tags
          const numUserTags = 3 + Math.floor(Math.random() * 5);
          const shuffledTags = [...tagIds].sort(() => 0.5 - Math.random());
          const selectedTags = shuffledTags.slice(0, numUserTags);
          for (const tagId of selectedTags) {
            await client.query(
              'INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [userId, tagId]
            );
          }

          // Seed photos
          const numPhotos = 2 + Math.floor(Math.random() * 4);
          for (let j = 0; j < numPhotos; j++) {
            const photoUrl = `${placeholderPhotos[Math.floor(Math.random() * placeholderPhotos.length)]}?sig=${userId}-${j}`;
            await client.query(
              'INSERT INTO photos (user_id, photo_url, is_profile_picture) VALUES ($1, $2, $3)',
              [userId, photoUrl, j === 0]
            );
          }
        }
      }
    }

    // Seed Likes and Blocks
    console.log('🤝 Seeding likes and matches...');
    const numLikes = 40;
    const numMatches = 8;
    const numBlocks = 8;

    if (!dryRun) {
      // Seed Matches (Mutual Likes)
      for (let i = 0; i < numMatches; i++) {
        const u1 = userIds[Math.floor(Math.random() * userIds.length)];
        let u2 = userIds[Math.floor(Math.random() * userIds.length)];
        while (u1 === u2) u2 = userIds[Math.floor(Math.random() * userIds.length)];
        
        await client.query('INSERT INTO likes (liker_user_id, liked_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [u1, u2]);
        await client.query('INSERT INTO likes (liker_user_id, liked_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [u2, u1]);
      }

      // Seed extra Likes
      for (let i = 0; i < numLikes - (numMatches * 2); i++) {
        const u1 = userIds[Math.floor(Math.random() * userIds.length)];
        let u2 = userIds[Math.floor(Math.random() * userIds.length)];
        while (u1 === u2) u2 = userIds[Math.floor(Math.random() * userIds.length)];
        await client.query('INSERT INTO likes (liker_user_id, liked_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [u1, u2]);
      }

      // Seed Blocks
      console.log('🚫 Seeding blocks...');
      for (let i = 0; i < numBlocks; i++) {
        const u1 = userIds[Math.floor(Math.random() * userIds.length)];
        let u2 = userIds[Math.floor(Math.random() * userIds.length)];
        while (u1 === u2) u2 = userIds[Math.floor(Math.random() * userIds.length)];
        await client.query('INSERT INTO blocks (blocker_user_id, blocked_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [u1, u2]);
      }
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║     TEST DATA SEEDED SUCCESSFULLY ✓       ║');
    console.log('├════════════════════════════════════════════┤');
    console.log(`║ Users:        ${numUsers} (${numVerified} verified, ${numUsers - numVerified} unverified)`);
    console.log(`║ Profiles:     ${userIds.length}`);
    console.log(`║ Photos:       ~${userIds.length * 3.5} (avg 3.5/user)`);
    console.log(`║ Tags:         ${tags.length} unique`);
    console.log(`║ Likes:        ${numLikes} (includes ${numMatches} mutual matches)`);
    console.log(`║ Blocks:       ${numBlocks}`);
    console.log('╚════════════════════════════════════════════╝\n');

  } catch (err) {
    console.error('❌ Error seeding data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
