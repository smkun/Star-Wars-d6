#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection(process.env.MYSQL_URL);

  // X-wing family
  console.log('Setting up X-wing family...\n');
  const [xwings] = await conn.execute(
    'SELECT slug, name FROM starships WHERE name LIKE "%X-wing%" OR name LIKE "%X-Wing%" ORDER BY name'
  );
  console.log(`Found ${xwings.length} X-wing ships:`);
  xwings.forEach(x => console.log(`  - ${x.name}`));

  const xBase = xwings.find(x => x.name === 'X-Wing') || xwings[0];
  await conn.execute('UPDATE starships SET parent = NULL, isVariant = FALSE WHERE slug = ?', [xBase.slug]);
  console.log(`✓ Base: ${xBase.name}\n`);

  for (const x of xwings) {
    if (x.slug !== xBase.slug) {
      await conn.execute('UPDATE starships SET parent = ?, isVariant = TRUE WHERE slug = ?', ['X-Wing', x.slug]);
      console.log(`  ✓ Variant: ${x.name}`);
    }
  }

  // Y-wing family
  console.log(`\n\nSetting up Y-wing family...\n`);
  const [ywings] = await conn.execute(
    'SELECT slug, name FROM starships WHERE name LIKE "%Y-wing%" OR name LIKE "%Y-Wing%" ORDER BY name'
  );
  console.log(`Found ${ywings.length} Y-wing ships:`);
  ywings.forEach(y => console.log(`  - ${y.name}`));

  const yBase = ywings.find(y => y.name === 'Y-Wing' || y.name === 'Y-wing') || ywings[0];
  await conn.execute('UPDATE starships SET parent = NULL, isVariant = FALSE WHERE slug = ?', [yBase.slug]);
  console.log(`✓ Base: ${yBase.name}\n`);

  for (const y of ywings) {
    if (y.slug !== yBase.slug) {
      await conn.execute('UPDATE starships SET parent = ?, isVariant = TRUE WHERE slug = ?', [yBase.name, y.slug]);
      console.log(`  ✓ Variant: ${y.name}`);
    }
  }

  await conn.end();
  console.log(`\n✅ X-wing and Y-wing families complete`);
})();
