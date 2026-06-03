const fs = require('fs');
const { Pool } = require('pg');

const envPath = '.env';
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

const [, , migrationPath] = process.argv;
if (!migrationPath) {
  console.error('Usage: node scripts/apply-migration.cjs <migration.sql>');
  process.exit(1);
}

const connectionString = process.env.LOCAL_DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error('Missing LOCAL_DATABASE_URL or NEON_DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const sql = fs.readFileSync(migrationPath, 'utf8');

pool
  .query(sql)
  .then(() => {
    console.log(`Applied ${migrationPath}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
