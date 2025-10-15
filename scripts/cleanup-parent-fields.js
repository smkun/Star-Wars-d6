#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection(process.env.MYSQL_URL);

  // Clean up B-wing parent references
  await conn.execute(
    'UPDATE starships SET parent = "B-wing" WHERE parent = "[[Running the B-wing]]"'
  );
  console.log('✓ Cleaned B-wing parent references');

  // Consolidate TIE variants to "TIE Starfighter"
  await conn.execute(
    'UPDATE starships SET parent = "TIE Starfighter" WHERE parent = "TIE Fighter"'
  );
  console.log('✓ Consolidated TIE variants');

  // Clean wiki markup from parent fields
  await conn.execute(
    'UPDATE starships SET parent = TRIM(REPLACE(REPLACE(parent, "[[", ""), "]]", "")) WHERE parent LIKE "%[[%"'
  );
  console.log('✓ Cleaned wiki markup from parent fields');

  // Remove triple quotes
  await conn.execute(
    "UPDATE starships SET parent = REPLACE(REPLACE(REPLACE(parent, \"'''\", ''), \"'''\", ''), \"'''\", '') WHERE parent LIKE \"%'''%\""
  );
  console.log('✓ Removed wiki quotes from parent fields');

  await conn.end();
  console.log('\n✅ Parent field cleanup complete');
})();
