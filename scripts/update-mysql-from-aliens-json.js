#!/usr/bin/env node
/**
 * Update MySQL species table with complete data from ALIENS.json
 * Adds: personality, physicalDescription, adventurers, languages, sources
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const ALIENS_JSON_PATH = path.join(__dirname, '..', 'ALIENS.json');
const MYSQL_URL = process.env.MYSQL_URL;

if (!MYSQL_URL) {
  console.error('MYSQL_URL environment variable is required');
  process.exit(1);
}

async function main() {
  console.log('Reading ALIENS.json...');
  const data = JSON.parse(fs.readFileSync(ALIENS_JSON_PATH, 'utf8'));
  const aliensData = data.races || data;
  console.log(`Found ${aliensData.length} species in ALIENS.json\n`);

  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection(MYSQL_URL);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const alien of aliensData) {
    const slug = alien.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    try {
      // Check if species exists in MySQL
      const [rows] = await conn.query('SELECT properties FROM species WHERE slug = ?', [slug]);

      if (rows.length === 0) {
        console.log(`⚠️  ${alien.name} (${slug}) - not in MySQL, skipping`);
        skipped++;
        continue;
      }

      // Parse existing properties
      const existingProps = JSON.parse(rows[0].properties || '{}');

      // Merge with ALIENS.json data
      const updatedProps = {
        ...existingProps,
        // Add/update these fields from ALIENS.json
        sources: alien.sources || existingProps.sources || [],
      };

      // Add optional fields if they exist
      if (alien.personality) updatedProps.personality = alien.personality;
      if (alien.physicalDescription) updatedProps.physicalDescription = alien.physicalDescription;
      if (alien.adventurers) updatedProps.adventurers = alien.adventurers;
      if (alien.languages) updatedProps.languages = alien.languages;

      // Update MySQL
      await conn.query(
        'UPDATE species SET properties = ? WHERE slug = ?',
        [JSON.stringify(updatedProps), slug]
      );

      console.log(`✅ ${alien.name} (${slug}) - updated`);
      updated++;

    } catch (err) {
      console.error(`❌ ${alien.name} (${slug}) - error:`, err.message);
      errors++;
    }
  }

  await conn.end();

  console.log('\n=== Update Summary ===');
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total in ALIENS.json: ${aliensData.length}`);
}

main().catch(console.error);
