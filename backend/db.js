require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create all tables if they don't exist
async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      class TEXT,
      school TEXT,
      dob TEXT NOT NULL,
      phone1 TEXT,
      phone2 TEXT,
      father_name TEXT,
      mother_name TEXT,
      address TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coaches (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS batches (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      coach_id INTEGER REFERENCES coaches(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS batch_students (
      id SERIAL PRIMARY KEY,
      batch_id INTEGER NOT NULL REFERENCES batches(id),
      student_id INTEGER NOT NULL REFERENCES students(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      batch_id INTEGER NOT NULL REFERENCES batches(id),
      student_id INTEGER NOT NULL REFERENCES students(id),
      date TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fee_payments (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      category TEXT NOT NULL,
      month TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_date TEXT NOT NULL
    )
  `);

  console.log('All tables ready.');
}

initTables().catch((err) => console.error('Error creating tables:', err));

module.exports = pool;