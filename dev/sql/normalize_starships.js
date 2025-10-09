#!/usr/bin/env node
'use strict';

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const MYSQL_URL = process.env.MYSQL_URL;
if (!MYSQL_URL) {
  console.error(
    'Please set MYSQL_URL environment variable (mysql://user:pass@host:3306/db)'
  );
  process.exit(2);
}

const BATCH_SIZE = 200;

async function ensureTables(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS starship_weapons (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      ship_slug VARCHAR(255),
      weapon_index INT,
      weapon_json LONGTEXT,
      weapon_text LONGTEXT,
      FOREIGN KEY (ship_slug) REFERENCES starships(slug)
    ) ENGINE=InnoDB;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS starship_sensors (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      ship_slug VARCHAR(255),
      sensor_index INT,
      sensor_json LONGTEXT,
      sensor_text LONGTEXT,
      FOREIGN KEY (ship_slug) REFERENCES starships(slug)
    ) ENGINE=InnoDB;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS starship_sources (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      ship_slug VARCHAR(255),
      source_index INT,
      source_text LONGTEXT,
      FOREIGN KEY (ship_slug) REFERENCES starships(slug)
    ) ENGINE=InnoDB;
  `);
}

function tryParseJsonOrNull(text) {
  if (!text) return null;
  // if it already looks like JSON array/object try parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // try to transform common single-quoted arrays/JS objects into JSON
    const cleaned = text.replace(/\n/g, ' ').trim();
    try {
      return JSON.parse(cleaned);
    } catch (_) {
      return null;
    }
  }
}

async function normalize(conn) {
  const [rowsCount] = await conn.query('SELECT COUNT(*) AS c FROM starships');
  const total = rowsCount[0].c;
  console.log('Total starships to process:', total);

  for (let offset = 0; offset < total; offset += BATCH_SIZE) {
    const [rows] = await conn.query(
      'SELECT slug, weapons, sensors, sources FROM starships LIMIT ? OFFSET ?',
      [BATCH_SIZE, offset]
    );
    console.log('Processing', rows.length, 'rows (offset', offset + 1, ')');

    for (const r of rows) {
      const slug = r.slug;

      // weapons
      const weaponsJson = tryParseJsonOrNull(r.weapons);
      if (weaponsJson && Array.isArray(weaponsJson)) {
        let idx = 0;
        for (const w of weaponsJson) {
          await conn.query(
            'INSERT INTO starship_weapons (ship_slug, weapon_index, weapon_json) VALUES (?, ?, ?)',
            [slug, idx++, JSON.stringify(w)]
          );
        }
        // store back a normalized JSON column
        await conn.query(
          'ALTER TABLE starships ADD COLUMN IF NOT EXISTS weapons_json JSON'
        );
        await conn.query(
          'UPDATE starships SET weapons_json = ? WHERE slug = ?',
          [JSON.stringify(weaponsJson), slug]
        );
      } else if (r.weapons) {
        // fallback: store raw text as single row
        await conn.query(
          'INSERT INTO starship_weapons (ship_slug, weapon_index, weapon_text) VALUES (?, ?, ?)',
          [slug, 0, r.weapons]
        );
      }

      // sensors
      const sensorsJson = tryParseJsonOrNull(r.sensors);
      if (
        sensorsJson &&
        (Array.isArray(sensorsJson) || typeof sensorsJson === 'object')
      ) {
        if (Array.isArray(sensorsJson)) {
          let idx = 0;
          for (const s of sensorsJson) {
            await conn.query(
              'INSERT INTO starship_sensors (ship_slug, sensor_index, sensor_json) VALUES (?, ?, ?)',
              [slug, idx++, JSON.stringify(s)]
            );
          }
        } else {
          // object -> store single
          await conn.query(
            'INSERT INTO starship_sensors (ship_slug, sensor_index, sensor_json) VALUES (?, ?, ?)',
            [slug, 0, JSON.stringify(sensorsJson)]
          );
        }
        await conn.query(
          'ALTER TABLE starships ADD COLUMN IF NOT EXISTS sensors_json JSON'
        );
        await conn.query(
          'UPDATE starships SET sensors_json = ? WHERE slug = ?',
          [JSON.stringify(sensorsJson), slug]
        );
      } else if (r.sensors) {
        await conn.query(
          'INSERT INTO starship_sensors (ship_slug, sensor_index, sensor_text) VALUES (?, ?, ?)',
          [slug, 0, r.sensors]
        );
      }

      // sources
      const sourcesJson = tryParseJsonOrNull(r.sources);
      if (sourcesJson && Array.isArray(sourcesJson)) {
        let idx = 0;
        for (const s of sourcesJson) {
          await conn.query(
            'INSERT INTO starship_sources (ship_slug, source_index, source_text) VALUES (?, ?, ?)',
            [slug, idx++, String(s)]
          );
        }
        await conn.query(
          'ALTER TABLE starships ADD COLUMN IF NOT EXISTS sources_json JSON'
        );
        await conn.query(
          'UPDATE starships SET sources_json = ? WHERE slug = ?',
          [JSON.stringify(sourcesJson), slug]
        );
      } else if (r.sources) {
        // try split by newline or comma
        const parts = String(r.sources)
          .split(/,|\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        let idx = 0;
        for (const p of parts) {
          await conn.query(
            'INSERT INTO starship_sources (ship_slug, source_index, source_text) VALUES (?, ?, ?)',
            [slug, idx++, p]
          );
        }
        await conn.query(
          'ALTER TABLE starships ADD COLUMN IF NOT EXISTS sources_json JSON'
        );
        try {
          await conn.query(
            'UPDATE starships SET sources_json = ? WHERE slug = ?',
            [JSON.stringify(parts), slug]
          );
        } catch (_) {}
      }
    }
  }
}

async function main() {
  const conn = await mysql.createConnection(MYSQL_URL);
  try {
    await ensureTables(conn);
    await normalize(conn);
    console.log('Normalization complete');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Normalization failed:', err);
  process.exit(1);
});
