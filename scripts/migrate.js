// Removed dotenv
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url TEXT`;
    console.log('Successfully added cover_url column to users table');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
