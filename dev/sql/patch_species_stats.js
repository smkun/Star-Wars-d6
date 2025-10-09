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

const args = process.argv.slice(2);
const commit = args.includes('--commit');

function makeSlug(item) {
  return (
    item.slug ||
    (item.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  );
}

async function main() {
  const inputPath = path.resolve(__dirname, '../../ALIENS.json');
  if (!fs.existsSync(inputPath)) {
    console.error('Missing ALIENS.json at', inputPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(raw);
  const items = parsed.races || parsed.aliens || parsed.items || parsed;

  const conn = await mysql.createConnection(MYSQL_URL);
  try {
    let wouldUpdate = 0;
    let applied = 0;
    const examples = [];

    for (const item of items) {
      const slug = makeSlug(item);
      const name = item.name || '';
      const classification = item.classification || null;
      const homeworld = item.homeworld || null;
      const description = item.description || null;
      const imageUrl = item.imageUrl || item.image || null;

      // build merged properties: keep existing `properties` object from source if present
      const sourceProps = Object.assign(
        {},
        item.properties || item.extra || {}
      );

      // copy over game stat fields if present
      if (item.stats) sourceProps.stats = item.stats;
      if (item.specialAbilities)
        sourceProps.specialAbilities = item.specialAbilities;
      if (item.storyFactors) sourceProps.storyFactors = item.storyFactors;
      if (item.notes) sourceProps.notes = item.notes;

      const propsStr = JSON.stringify(sourceProps);

      // check current row
      const [rows] = await conn.query(
        'SELECT properties FROM species WHERE slug = ?',
        [slug]
      );
      if (!rows || rows.length === 0) {
        wouldUpdate++;
        if (examples.length < 10)
          examples.push({ slug, name, action: 'insert' });
        if (commit) {
          const sql = `REPLACE INTO species (slug,name,classification,homeworld,description,properties,imageUrl) VALUES (?,?,?,?,?,?,?);`;
          await conn.query(sql, [
            slug,
            name,
            classification,
            homeworld,
            description,
            propsStr,
            imageUrl,
          ]);
          applied++;
        }
        continue;
      }

      const current = rows[0].properties || '';
      let currentParsed = {};
      try {
        currentParsed =
          current && typeof current === 'string'
            ? JSON.parse(current)
            : current;
      } catch (e) {
        // non-json current contents: we'll replace
        currentParsed = {};
      }

      // Determine if we need to update: if stats or other game keys are missing or different
      const needUpdate =
        JSON.stringify(currentParsed.stats || {}) !==
          JSON.stringify(sourceProps.stats || {}) ||
        JSON.stringify(currentParsed.specialAbilities || []) !==
          JSON.stringify(sourceProps.specialAbilities || []) ||
        (currentParsed.notes || '') !== (sourceProps.notes || '');

      if (needUpdate) {
        wouldUpdate++;
        if (examples.length < 10)
          examples.push({
            slug,
            name,
            action: 'update',
            before: currentParsed,
            after: sourceProps,
          });
        if (commit) {
          // merge existing top-level keys with sourceProps (sourceProps take precedence)
          const merged = Object.assign({}, currentParsed, sourceProps);
          const mergedStr = JSON.stringify(merged);
          await conn.query('UPDATE species SET properties = ? WHERE slug = ?', [
            mergedStr,
            slug,
          ]);
          applied++;
        }
      }
    }

    console.log(
      `Dry-run: ${wouldUpdate} species would be inserted/updated.` +
        (commit ? '' : ' (run with --commit to apply)')
    );
    if (commit) console.log(`Applied ${applied} changes.`);
    if (examples.length) {
      console.log('Examples (up to 10):');
      for (const ex of examples) {
        console.log(JSON.stringify(ex, null, 2));
      }
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
