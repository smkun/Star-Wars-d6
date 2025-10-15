#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection(process.env.MYSQL_URL);
  
  // Define variant families
  const families = [
    'X-wing',
    'Y-wing', 
    'TIE Fighter',
    'A-wing',
    'B-wing',
    'Z-95 Headhunter'
  ];
  
  console.log('Setting up starfighter families...\n');
  
  for (const familyName of families) {
    // Find all ships with names containing the family name
    const [ships] = await conn.execute(
      'SELECT slug, name FROM starships WHERE name LIKE ? ORDER BY name',
      [`%${familyName}%`]
    );
    
    if (ships.length === 0) {
      console.log(`⚠️  No ships found for ${familyName}`);
      continue;
    }
    
    console.log(`${familyName} family: found ${ships.length} ships`);
    
    // Set the base ship (exact match or first one)
    const baseShip = ships.find(s => s.name === familyName) || ships[0];
    
    // Update base ship
    await conn.execute(
      'UPDATE starships SET parent = NULL, isVariant = FALSE WHERE slug = ?',
      [baseShip.slug]
    );
    console.log(`  ✓ Base: ${baseShip.name}`);
    
    // Update all variants
    for (const ship of ships) {
      if (ship.slug !== baseShip.slug) {
        await conn.execute(
          'UPDATE starships SET parent = ?, isVariant = TRUE WHERE slug = ?',
          [baseShip.name, ship.slug]
        );
        console.log(`  ✓ Variant: ${ship.name}`);
      }
    }
    console.log('');
  }
  
  // Show summary
  const [stats] = await conn.execute(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN parent IS NOT NULL THEN 1 ELSE 0 END) as variants,
      SUM(CASE WHEN isVariant = FALSE AND parent IS NULL THEN 1 ELSE 0 END) as standalone
    FROM starships
    WHERE category = 'starfighter'
  `);
  
  console.log('📊 Starfighter Summary:');
  console.log(`  Total: ${stats[0].total}`);
  console.log(`  Variants: ${stats[0].variants}`);
  console.log(`  Standalone: ${stats[0].standalone}`);
  
  await conn.end();
})();
