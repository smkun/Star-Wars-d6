#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const outDir = path.resolve(__dirname);
const files = [
  'schema.sql',
  'starfighters.sql',
  'transports.sql',
  'capital.sql',
];

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');

async function run() {
  const mysqlUrl = process.env.MYSQL_URL;
  if (!mysqlUrl && !dryRun) {
    console.error(
      'Missing MYSQL_URL environment variable. Example: mysql://user:pass@host:3306/dbname'
    );
    process.exit(2);
  }

  for (const f of files) {
    const p = path.join(outDir, f);
    if (!fs.existsSync(p)) {
      console.warn('Skipping missing file', p);
      continue;
    }

    const sql = fs.readFileSync(p, 'utf8');
    if (dryRun) {
      console.log('--- DRY RUN: would execute', p, '---\n');
      console.log(sql.slice(0, 1000));
      console.log('\n--- end preview ---\n');
      continue;
    }

    console.log('Executing', p);
    const conn = await mysql.createConnection(mysqlUrl);
    try {
      // split on semicolon that ends statements; simple but works for our generated files
      const statements = sql
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      console.log('Finished', p);
    } finally {
      await conn.end();
    }
  }
}

run().catch((err) => {
  console.error('Error running import:', err);
  process.exit(1);
});
