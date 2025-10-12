#!/usr/bin/env node
/**
 * Export MySQL data to static JSON files for frontend
 * Run before deployment to generate data files
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MYSQL_URL = process.env.MYSQL_URL;
const OUTPUT_DIR = path.join(__dirname, '..', 'web', 'public', 'data');

if (!MYSQL_URL) {
  console.error('❌ Error: MYSQL_URL environment variable not set');
  process.exit(1);
}

async function exportData() {
  let connection;

  try {
    connection = await mysql.createConnection(MYSQL_URL);
    console.log('✅ Connected to MySQL\n');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Export species
    console.log('📦 Exporting species...');
    const [species] = await connection.execute('SELECT * FROM species');

    const speciesData = species.map(s => {
      const props = s.properties ? JSON.parse(s.properties) : {};
      return {
        id: s.slug,
        slug: s.slug,
        name: s.name,
        classification: s.classification,
        homeworld: s.homeworld,
        description: s.description,
        imageUrl: s.imageUrl,
        ...props
      };
    });

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'species.json'),
      JSON.stringify(speciesData, null, 2)
    );
    console.log(`✅ Exported ${speciesData.length} species`);

    // Export starships
    console.log('\n📦 Exporting starships...');
    const [starships] = await connection.execute('SELECT * FROM starships');

    const starshipsData = starships.map(s => ({
      id: s.slug,
      slug: s.slug,
      name: s.name,
      craft: s.craft,
      affiliation: s.affiliation,
      type: s.type,
      category: s.category,
      scale: s.scale,
      length: s.length,
      crew: s.crew,
      crewSkill: s.crewSkill,
      passengers: s.passengers,
      cargoCapacity: s.cargoCapacity,
      consumables: s.consumables,
      cost: s.cost,
      skill: s.skill,
      hyperdrive: s.hyperdrive,
      navComputer: s.navComputer,
      maneuverability: s.maneuverability,
      space: s.space,
      atmosphere: s.atmosphere,
      hull: s.hull,
      shields: s.shields,
      weapons: s.weapons_json ? JSON.parse(s.weapons_json) : [],
      sensors: s.sensors_json ? JSON.parse(s.sensors_json) : null,
      description: s.description,
      imageUrl: s.imageUrl,
      imageFilename: s.imageFilename,
      parent: s.parent,
      isVariant: Boolean(s.isVariant),
      notes: s.notes,
      sources: s.sources_json ? JSON.parse(s.sources_json) : []
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'starships.json'),
      JSON.stringify(starshipsData, null, 2)
    );
    console.log(`✅ Exported ${starshipsData.length} starships`);

    console.log('\n✅ Export complete!');
    console.log(`📁 Files written to: ${OUTPUT_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Run: npm run build:web');
    console.log('2. Upload web/dist/* to iFastNet');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

exportData();
