#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MYSQL_URL = process.env.MYSQL_URL;
if (!MYSQL_URL) {
  console.error('Please set MYSQL_URL environment variable');
  process.exit(2);
}

async function main() {
  const conn = await mysql.createConnection(MYSQL_URL);
  try {
    // create species table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS species (
        slug VARCHAR(255) PRIMARY KEY,
        name TEXT NOT NULL,
        classification VARCHAR(255),
        homeworld VARCHAR(255),
        description LONGTEXT,
        properties JSON,
        imageUrl TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const inputPath = path.resolve(__dirname, '../../ALIENS.json');
    if (!fs.existsSync(inputPath)) {
      console.error('Missing ALIENS.json at', inputPath);
      process.exit(1);
    }
    const raw = fs.readFileSync(inputPath, 'utf8');
    const parsed = JSON.parse(raw);
    // ALIENS.json uses top-level 'races' key
    const items = parsed.races || parsed.aliens || parsed.items || parsed;

    let inserted = 0;
    for (const item of items) {
      const slug =
        item.slug ||
        (item.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      const name = item.name || '';
      const classification = item.classification || null;
      const homeworld = item.homeworld || null;
      const description = item.description || null;
      const properties = JSON.stringify(item.properties || item.extra || {});
      const imageUrl = item.imageUrl || item.image || null;

      const sql = `REPLACE INTO species (slug,name,classification,homeworld,description,properties,imageUrl) VALUES (?,?,?,?,?,?,?);`;
      await conn.query(sql, [
        slug,
        name,
        classification,
        homeworld,
        description,
        properties,
        imageUrl,
      ]);
      inserted++;
    }
    console.log('Imported', inserted, 'species');
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
