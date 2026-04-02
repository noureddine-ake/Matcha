// PostgreSQL connection pool
import pkg from 'pg';
import dotenv from 'dotenv';
import { ORM } from '../src/db/orm.js';

dotenv.config();

const { Pool } = pkg;

const DbPort = process.env.PGPORT

export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(DbPort || ''),
});

