import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/config/config.js';

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build absolute path to schema.sql
const schemaPath = path.join(__dirname, '../db/schema.sql');

export async function initDB() {
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Database schema created successfully');
  } catch (err) {
    console.error('❌ Error creating schema:', err);
  } finally {
    await pool.end();
  }
}

initDB();
