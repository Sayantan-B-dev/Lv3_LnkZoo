// Apply a .sql file to a target DB.
// Usage: node scripts/run-sql.js <file.sql> <local|neon>
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

async function main() {
  loadEnv();
  const file = process.argv[2];
  const target = (process.argv[3] || 'local').toLowerCase();
  if (!file) { console.error('Usage: node scripts/run-sql.js <file.sql> <local|neon>'); process.exit(1); }

  const conn = target === 'neon' ? process.env.NEON_DATABASE_URL : process.env.LOCAL_DATABASE_URL;
  if (!conn) { console.error(`No connection string for target "${target}"`); process.exit(1); }

  const sqlText = fs.readFileSync(path.resolve(file), 'utf8');
  const pool = new Pool({
    connectionString: conn,
    ssl: target === 'neon' ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await pool.query(sqlText);
    console.log(`[OK] Applied ${path.basename(file)} to ${target}`);
  } catch (err) {
    console.error(`[FAIL] ${target}:`, err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
