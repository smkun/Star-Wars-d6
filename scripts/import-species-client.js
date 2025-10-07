#!/usr/bin/env node
const { readFileSync } = require('fs');
const { resolve } = require('path');
const { execFileSync } = require('child_process');

const API_KEY = 'AIzaSyAvN3w0J2lNXsnc8WjaPjvsljOyb-UCLww';
const PROJECT_ID = 'star-wars-d6-species';
const CREATE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/species`;

function loadRecords() {
  const raw = readFileSync(resolve(process.cwd(), 'ALIENS.json'), 'utf-8');
  const payload = JSON.parse(raw);
  const records = Array.isArray(payload) ? payload : payload?.races;
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('ALIENS.json must contain a non-empty races array');
  }
  return records;
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

function createDocument(docData, slug) {
  const fields = JSON.stringify({ fields: toValue(docData).mapValue.fields });
  const url = `${CREATE_URL}?key=${API_KEY}&documentId=${encodeURIComponent(slug)}`;
  try {
    execFileSync('curl', ['-sS', '-X', 'POST', '-H', 'Content-Type: application/json', url, '-d', fields], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  } catch (error) {
    const stderr = error.stderr?.toString() ?? error.message;
    throw new Error(`Failed to import ${slug}: ${stderr}`);
  }
}

function main() {
  const records = loadRecords();
  records.forEach((record, index) => {
    const slug = slugify(record.name ?? `species-${index}`, record.id ?? index);
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
      updatedAt: new Date(),
    };

    process.stdout.write(`Importing ${slug}\r`);
    createDocument(docData, slug);
  });

  console.log(`\n✅ Imported ${records.length} species documents.`);
}

main();
