#!/usr/bin/env node
// Archived copy of scripts/import-sample-firestore.js
const fs = require('fs');

async function importSample(pathToJson) {
  const data = JSON.parse(fs.readFileSync(pathToJson, 'utf8'));
  console.log(
    `Would import ${data.length} sample documents to Firestore (archived copy).`
  );
}

module.exports = { importSample };
