#!/usr/bin/env node
/**
 * Import species to Firestore using Firebase Admin SDK (no permission issues)
 * Usage: node scripts/import-with-admin.js <path-to-json>
 */

const { readFileSync } = require('fs');
const { resolve } = require('path');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'star-wars-d6-species',
});

const db = admin.firestore();

function slugify(name, fallback) {
  const base = name
    .normalize('NFKD')
    .replace(/[''`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return base || `species-${fallback}`;
}

function generateSortName(name) {
  return name.trim().toLowerCase().replace(/^(the |an |a )/, '').trim();
}

function tokenize(...parts) {
  const tokens = new Set();
  for (const part of parts) {
    if (!part) continue;
    const asString = Array.isArray(part) ? part.join(' ') : part;
    asString
      .toString()
      .split(/[^a-zA-Z0-9]+/)
      .map((token) => token.toLowerCase().trim())
      .filter(Boolean)
      .forEach((token) => tokens.add(token));
  }
  return Array.from(tokens);
}

function normalizeDice(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

function normalizeAttributes(attrs = {}) {
  const result = {};
  for (const [key, range] of Object.entries(attrs)) {
    if (!range || typeof range !== 'object') continue;
    result[key] = {
      min: normalizeDice(range.min),
      max: normalizeDice(range.max),
    };
  }
  return result;
}

async function importSpecies(jsonPath) {
  const raw = readFileSync(jsonPath, 'utf-8');
  const payload = JSON.parse(raw);

  // Handle both ALIENS.json format and import-ready.json format
  const records = payload.species || payload.races || payload;

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('JSON must contain a non-empty species or races array');
  }

  console.log(`Importing ${records.length} species documents...\n`);

  const batch = db.batch();
  let count = 0;

  for (const record of records) {
    const slug = slugify(record.name ?? `species-${count}`, record.id ?? count);
    const normalizedStats = {
      ...record.stats,
      attributeDice: normalizeDice(record?.stats?.attributeDice ?? ''),
      attributes: normalizeAttributes(record?.stats?.attributes ?? {}),
    };

    const docData = {
      ...record,
      stats: normalizedStats,
      slug,
      searchName: (record.name ?? '').trim().toLowerCase(),
      searchTokens: tokenize(record.name, record.homeworld, record.sources ?? []),
      sortName: generateSortName(record.name ?? slug),
      hasImage: Boolean(record.imageUrl),
      imagePath: record.imageUrl ? `aliens/${slug}.webp` : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = db.collection('species').doc(slug);
    batch.set(docRef, docData, { merge: true });

    count++;
    if (count % 10 === 0) {
      process.stdout.write(`Queued ${count}/${records.length}\r`);
    }
  }

  console.log(`\nCommitting batch write...`);
  await batch.commit();
  console.log(`✅ Successfully imported ${count} species documents.`);

  return count;
}

async function main() {
  const jsonPath = process.argv[2];

  if (!jsonPath) {
    console.error('Usage: node scripts/import-with-admin.js <path-to-json>');
    console.error('Example: node scripts/import-with-admin.js ALIENS.json');
    console.error('Example: node scripts/import-with-admin.js "Source Data/d6holocron/import-ready.json"');
    process.exit(1);
  }

  const fullPath = resolve(process.cwd(), jsonPath);

  try {
    await importSpecies(fullPath);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

main();
