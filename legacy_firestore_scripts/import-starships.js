#!/usr/bin/env node
// Archived copy of scripts/import-starships.js
// Usage: EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/import-starships.js <import-ready-json>

const fs = require('fs');
const path = require('path');

const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT || 'star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function importStarships(jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  // ...original logic preserved in archive
}

module.exports = { importStarships };
