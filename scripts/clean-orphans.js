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

    const tablesToClean = [
      'business_hours',
      'business_gallery',
      'promotions',
      'business_staff'
    ];

    let businessesExists = false;
    try {
      await client.query(`SELECT 1 FROM businesses LIMIT 1`);
      businessesExists = true;
    } catch (e) {
      console.log('businesses table does not exist yet.');
    }

    for (const table of tablesToClean) {
      try {
        if (businessesExists) {
          const res = await client.query(`DELETE FROM ${table} WHERE business_id NOT IN (SELECT id FROM businesses)`);
          console.log(`Cleaned ${res.rowCount} orphaned rows from ${table}.`);
        } else {
          const res = await client.query(`DELETE FROM ${table}`);
          console.log(`Deleted all ${res.rowCount} rows from ${table} because businesses does not exist.`);
        }
      } catch (e) {
        console.log(`Skipped cleaning ${table} (may not exist yet).`);
      }
    }
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  } finally {
    await client.end();
  }
}

run();
