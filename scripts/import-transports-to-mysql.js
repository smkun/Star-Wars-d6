#!/usr/bin/env node
/**
 * Import transports from JSON to MySQL database
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function importTransports() {
  const dataPath = path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'starships', 'transports-variants-import-ready.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log(`Importing ${data.starships.length} transports to MySQL...`);

  const conn = await mysql.createConnection(process.env.MYSQL_URL);

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const ship of data.starships) {
    const slug = slugify(ship.name);

    try {
      // Check if exists
      const [existing] = await conn.query('SELECT slug FROM starships WHERE slug = ?', [slug]);

      const weaponsJson = ship.weapons && ship.weapons.length > 0 ? JSON.stringify(ship.weapons) : null;
      const sourcesJson = ship.sources && ship.sources.length > 0 ? JSON.stringify(ship.sources) : null;
      const sensorsJson = ship.sensors && typeof ship.sensors === 'object' ? JSON.stringify(ship.sensors) : null;
      const sensorsRaw = ship.sensors && typeof ship.sensors === 'object'
        ? `Passive: ${ship.sensors.passive || 'N/A'}, Scan: ${ship.sensors.scan || 'N/A'}, Search: ${ship.sensors.search || 'N/A'}, Focus: ${ship.sensors.focus || 'N/A'}`
        : null;

      const values = [
        slug,
        ship.name || '',
        ship.craft || null,
        ship.affiliation || null,
        ship.type || null,
        ship.category || 'transport',
        ship.scale || null,
        ship.length || null,
        ship.skill || null,
        ship.crew || null,
        ship.crewSkill || null,
        ship.passengers || null,
        ship.cargoCapacity || null,
        ship.consumables || null,
        ship.cost || null,
        ship.hyperdrive || null,
        ship.navComputer || null,
        ship.maneuverability || null,
        ship.space || null,
        ship.atmosphere || null,
        ship.hull || null,
        ship.shields || null,
        sensorsRaw,
        ship.weapons && ship.weapons.length > 0 ? ship.weapons.map(w => w.name).join(', ') : null,
        ship.description || null,
        ship.imageFilename || null,
        ship.imageUrl && ship.imageFilename ? `/d6StarWars/starships/${ship.imageFilename}` : null,
        ship.notes || null,
        ship.sources && ship.sources.length > 0 ? ship.sources.join(', ') : null,
        ship.pageId || null,
        ship.revisionId || null,
        weaponsJson,
        sensorsJson,
        sourcesJson
      ];

      if (existing.length > 0) {
        // Update
        await conn.query(`
          UPDATE starships SET
            name = ?, craft = ?, affiliation = ?, type = ?, category = ?,
            scale = ?, length = ?, skill = ?, crew = ?, crewSkill = ?,
            passengers = ?, cargoCapacity = ?, consumables = ?, cost = ?,
            hyperdrive = ?, navComputer = ?, maneuverability = ?, space = ?,
            atmosphere = ?, hull = ?, shields = ?, sensors_raw = ?, weapons_raw = ?,
            description = ?, imageFilename = ?, imageUrl = ?, notes = ?,
            sources_raw = ?, pageId = ?, revisionId = ?, weapons_json = ?,
            sensors_json = ?, sources_json = ?
          WHERE slug = ?
        `, [...values.slice(1), slug]);
        console.log(`✅ Updated: ${ship.name}`);
        updated++;
      } else {
        // Insert
        await conn.query(`
          INSERT INTO starships (
            slug, name, craft, affiliation, type, category, scale, length, skill,
            crew, crewSkill, passengers, cargoCapacity, consumables, cost,
            hyperdrive, navComputer, maneuverability, space, atmosphere,
            hull, shields, sensors_raw, weapons_raw, description, imageFilename,
            imageUrl, notes, sources_raw, pageId, revisionId, weapons_json,
            sensors_json, sources_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, values);
        console.log(`✅ Imported: ${ship.name}`);
        imported++;
      }
    } catch (err) {
      console.error(`❌ ${ship.name}: ${err.message}`);
      skipped++;
    }
  }

  await conn.end();

  console.log(`\nImport complete: ${imported} imported, ${updated} updated, ${skipped} skipped`);
}

importTransports().catch(console.error);
