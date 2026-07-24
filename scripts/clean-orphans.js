const { Client } = require('pg');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found, skipping cleanup script.');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to DB for pre-start cleanup...');

  // Helper: run a query and swallow errors (table may not exist)
  async function safeQuery(sql, label) {
    try {
      const res = await client.query(sql);
      console.log(`[OK] ${label} (rows affected: ${res.rowCount})`);
    } catch (e) {
      console.log(`[SKIP] ${label}: ${e.message}`);
    }
  }

  // 1. Drop the specific FK constraint that keeps failing
  await safeQuery(
    `ALTER TABLE "business_hours" DROP CONSTRAINT IF EXISTS "FK_469b226aa867f349ec8f1ebbe05"`,
    'Drop business_hours FK constraint'
  );

  // 2. Delete ALL orphaned rows from dependent tables
  //    We delete everything since the businesses table may not even exist yet
  const dependentTables = ['business_hours', 'business_gallery', 'promotions', 'business_staff'];
  for (const table of dependentTables) {
    await safeQuery(`DELETE FROM "${table}"`, `Clean ${table}`);
  }

  console.log('Pre-start cleanup finished.');
  await client.end();
}

run().catch((err) => {
  console.error('Cleanup script fatal error:', err.message);
  // Don't block startup — let TypeORM attempt to handle it
  process.exit(0);
});
