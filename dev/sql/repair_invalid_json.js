#!/usr/bin/env node
'use strict';

const mysql = require('mysql2/promise');

const MYSQL_URL = process.env.MYSQL_URL;
if (!MYSQL_URL) {
  console.error('Please set MYSQL_URL environment variable');
  process.exit(2);
}

function tryParse(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

function removePlaceholders(s) {
  return s.replace(/,?\s*\{\s*"name"\s*:\s*"\d+(?:-\d+)?"\s*\}\s*,?/g, '');
}

function escapeInnerQuotes(s) {
  // replace occurrences of \"word\" inside values like: "2 "egg" bombs" -> "2 \"egg\" bombs"
  return s.replace(/([^\\])"([^"]+?)"([^,:}\]]+)/g, function (_, a, inner, b) {
    // avoid touching field separators and JSON structure
    return a + '\\"' + inner + '\\"' + b;
  });
}

async function refreshWeapons(conn, slug, weaponsArr) {
  await conn.query('DELETE FROM starship_weapons WHERE ship_slug = ?', [slug]);
  for (let i = 0; i < weaponsArr.length; i++) {
    await conn.query(
      'INSERT INTO starship_weapons (ship_slug, weapon_index, weapon_json) VALUES (?, ?, ?)',
      [slug, i, JSON.stringify(weaponsArr[i])]
    );
  }
}

async function refreshSensors(conn, slug, sensorsVal) {
  await conn.query('DELETE FROM starship_sensors WHERE ship_slug = ?', [slug]);
  if (Array.isArray(sensorsVal)) {
    for (let i = 0; i < sensorsVal.length; i++) {
      await conn.query(
        'INSERT INTO starship_sensors (ship_slug, sensor_index, sensor_json) VALUES (?, ?, ?)',
        [slug, i, JSON.stringify(sensorsVal[i])]
      );
    }
  } else if (sensorsVal && typeof sensorsVal === 'object') {
    await conn.query(
      'INSERT INTO starship_sensors (ship_slug, sensor_index, sensor_json) VALUES (?, ?, ?)',
      [slug, 0, JSON.stringify(sensorsVal)]
    );
  }
}

async function main() {
  const conn = await mysql.createConnection(MYSQL_URL);
  try {
    const [rows] = await conn.query(
      'SELECT slug, weapons, sensors FROM starships WHERE JSON_VALID(weapons)=0 OR JSON_VALID(sensors)=0'
    );
    console.log('Found', rows.length, 'invalid rows to inspect');
    const applied = [];
    for (const r of rows) {
      let slug = r.slug;
      let weapons = r.weapons;
      let sensors = r.sensors;
      let fixed = false;

      if (weapons) {
        let s = weapons;
        // step 1: try removing placeholder numeric name entries
        let s1 = removePlaceholders(s);
        let j = tryParse(s1);
        if (!j) {
          // step 2: replace inner quotes heuristically
          let s2 = escapeInnerQuotes(s1);
          j = tryParse(s2);
          if (j) {
            s1 = s2;
          }
        }
        if (j) {
          // update weapons_json and normalized table
          await conn.query(
            'UPDATE starships SET weapons_json = ? WHERE slug = ?',
            [JSON.stringify(j), slug]
          );
          await refreshWeapons(conn, slug, j);
          fixed = true;
        }
      }

      if (!fixed && sensors) {
        let s = sensors;
        let s1 = s;
        let j = tryParse(s1);
        if (!j) {
          // try removing placeholders
          s1 = removePlaceholders(s);
          j = tryParse(s1);
        }
        if (j) {
          await conn.query(
            'UPDATE starships SET sensors_json = ? WHERE slug = ?',
            [JSON.stringify(j), slug]
          );
          await refreshSensors(conn, slug, j);
          fixed = true;
        }
      }

      if (fixed) applied.push(slug);
    }
    console.log('Applied fixes for', applied.length, 'ships');
    if (applied.length) console.log(applied.join(', '));
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
