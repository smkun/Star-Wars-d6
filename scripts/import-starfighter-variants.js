#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const JSON_FILE = path.join(__dirname, '..', 'Source Data', 'd6holocron', 'starships', 'starfighters-variants-import-ready.json');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Clean wiki markup from parent field
const cleanParent = (parent) => {
  if (!parent) return null;
  return parent.replace(/'''/g, '').trim();
};

(async () => {
  const conn = await mysql.createConnection(process.env.MYSQL_URL);

  console.log('Reading starfighter variants JSON...\n');
  const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  const ships = data.starships || [];

  console.log(`Found ${ships.length} starfighters with variants\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const ship of ships) {
    const slug = slugify(ship.name);
    const parent = cleanParent(ship.parent);
    const isVariant = Boolean(ship.isVariant);

    // Check if ship exists
    const [existing] = await conn.execute(
      'SELECT slug FROM starships WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      // Update parent and isVariant fields
      await conn.execute(
        'UPDATE starships SET parent = ?, isVariant = ? WHERE slug = ?',
        [parent, isVariant, slug]
      );
      updated++;
      console.log(`✓ Updated: ${ship.name} (parent: ${parent || 'none'}, isVariant: ${isVariant})`);
    } else {
      // Insert new ship
      await conn.execute(`
        INSERT INTO starships (
          slug, name, craft, affiliation, type, category, parent, isVariant,
          scale, length, crew, hyperdrive, maneuverability, space, hull, shields,
          imageFilename, imageUrl,
          weapons_json, sensors_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        slug,
        ship.name,
        ship.craft,
        ship.affiliation,
        ship.type,
        ship.category,
        parent,
        isVariant,
        ship.scale,
        ship.length,
        ship.crew,
        ship.hyperdrive,
        ship.maneuverability,
        ship.space,
        ship.hull,
        ship.shields,
        ship.imageFilename,
        ship.imageUrl || null,
        ship.weapons ? JSON.stringify(ship.weapons) : null,
        ship.sensors ? JSON.stringify(ship.sensors) : null
      ]);
      inserted++;
      console.log(`+ Inserted: ${ship.name} (parent: ${parent || 'none'})`);
    }
  }

  await conn.end();

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Inserted: ${inserted}`);
  console.log(`  🔄 Updated: ${updated}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  📦 Total: ${ships.length}`);
})();
