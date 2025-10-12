#!/usr/bin/env node
/**
 * Simple import script to insert a test character into the characters table.
 * Usage:
 *   MYSQL_URL="mysql://user:pass@host/db" node scripts/import-sample-character.js [--uid <firebase-uid>]
 * If --uid is omitted, the script will insert user_id as the email provided in the sample.
 */
const mysql = require('mysql2/promise');
const argv = require('minimist')(process.argv.slice(2));

const MYSQL_URL = process.env.MYSQL_URL;
if (!MYSQL_URL) {
  console.error('Please set MYSQL_URL');
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(MYSQL_URL);
  try {
    const uid = argv.uid || 'scottkunian@gmail.com';
    const id = require('crypto').randomUUID();
    const name = 'Ithorian Rebel Saboteur';
    const species_slug = 'ithorian';
    const data = {
      notes:
        'Imported sample character from Source Data/Characters/Ithorian Rebel Sabateur.pdf',
      attributes: { STR: '2D', DEX: '2D', PER: '2D', KNO: '2D' },
    };

    const sql =
      'INSERT INTO characters (id, user_id, name, species_slug, data) VALUES (?, ?, ?, ?, ?)';
    await conn.query(sql, [id, uid, name, species_slug, JSON.stringify(data)]);
    console.log('Inserted character with id', id, 'user_id', uid);
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
