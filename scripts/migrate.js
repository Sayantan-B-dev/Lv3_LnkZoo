// Removed dotenv
const { neon } = require('@neondatabase/serverless');

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Migration failed: NEON_DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(connectionString);

async function run() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url TEXT`;
    console.log('Successfully added cover_url column to users table');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
