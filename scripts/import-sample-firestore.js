#!/usr/bin/env node
const { readFileSync } = require('fs');
const { resolve } = require('path');

const PROJECT_ID = 'star-wars-d6-species';
const SAMPLE_COUNT = 20; // adjust as needed
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function getAccessToken() {
  const configPath = resolve(process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
  const raw = readFileSync(configPath, 'utf-8');
  const data = JSON.parse(raw);
  const token = data?.tokens?.access_token;
  if (!token) {
    throw new Error('Unable to read Firebase CLI access token');
  }
  return token;
}

function normalizeDice(value) {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase();
}

function normalizeAttributes(attrs = {}) {
  const result = {};
  for (const [key, range] of Object.entries(attrs)) {
    if (!range || typeof range !== 'object') continue;
    const { min, max } = range;
    result[key] = {
      min: normalizeDice(min),
      max: normalizeDice(max),
    };
  }
  return result;
}

function slugify(name, fallback) {
  const base = name
    .normalize('NFKD')
    .replace(/[’'`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return base || `species-${fallback}`;
}

function generateSortName(name) {
  const lowered = name.trim().toLowerCase();
  return lowered.replace(/^(the |an |a )/, '').trim();
}

function tokenize(...parts) {
  const tokens = new Set();
  parts
    .filter(Boolean)
    .join(' ')
    .split(/[^a-zA-Z0-9]+/)
    .map((token) => token.toLowerCase().trim())
    .filter(Boolean)
    .forEach((token) => tokens.add(token));
  return Array.from(tokens);
}

function toValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toValue(item)),
      },
    };
  }
  if (typeof value === 'object') {
    const fields = {};
    for (const [key, val] of Object.entries(value)) {
      if (val === undefined) continue;
      fields[key] = toValue(val);
    }
    return { mapValue: { fields } };
  }
  throw new Error(`Unsupported value type: ${typeof value}`);
}

function buildFirestoreDoc(species) {
  const slug = slugify(species.name, species.id ?? Date.now());
  const normalizedStats = {
    ...species.stats,
    attributeDice: normalizeDice(species.stats.attributeDice),
    attributes: normalizeAttributes(species.stats.attributes),
  };

  const searchName = species.name.trim().toLowerCase();
  const searchTokens = tokenize(
    species.name,
    species.homeworld,
    Array.isArray(species.sources) ? species.sources.join(' ') : ''
  );
  const sortName = generateSortName(species.name);

  const docData = {
    ...species,
    stats: normalizedStats,
    slug,
    searchName,
    searchTokens,
    sortName,
    hasImage: Boolean(species.imageUrl),
    imagePath: species.imageUrl ? `aliens/${slug}.webp` : undefined,
    updatedAt: new Date(),
  };

  return { slug, docData };
}

async function createDocument(token, slug, data) {
  const url = `${FIRESTORE_BASE}/species?documentId=${encodeURIComponent(slug)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fields: toValue(data).mapValue.fields }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to import ${slug}: ${response.status} ${text}`);
  }
}

async function main() {
  const raw = readFileSync(resolve(process.cwd(), 'ALIENS.json'), 'utf-8');
  const payload = JSON.parse(raw);
  const records = Array.isArray(payload) ? payload : payload?.races;
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('ALIENS.json must contain a races array');
  }

  const token = getAccessToken();
  const slice = records.slice(0, SAMPLE_COUNT);

  for (const species of slice) {
    const { slug, docData } = buildFirestoreDoc(species);
    console.log(`Importing ${species.name} -> ${slug}`);
    await createDocument(token, slug, docData);
  }

  console.log(`✅ Imported ${slice.length} species records into Firestore.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
