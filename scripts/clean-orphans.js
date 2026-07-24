const { Client } = require('pg');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found, skipping cleanup script.');
    return;
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB for pre-start cleanup...');
    const res = await client.query(`DELETE FROM business_hours WHERE business_id NOT IN (SELECT id FROM businesses)`);
    console.log(`Cleanup complete. Deleted ${res.rowCount} orphaned business_hours records.`);
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  } finally {
    await client.end();
  }
}

run();
