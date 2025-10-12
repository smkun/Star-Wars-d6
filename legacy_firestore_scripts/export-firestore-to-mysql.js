#!/usr/bin/env node
// Archived copy of scripts/export-firestore-to-mysql.js
// This script exported Firestore documents to a MySQL import format.
const fs = require('fs');

function previewExport(inputPath) {
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(
    `Previewing export of ${data.length} documents to MySQL (archived copy)`
  );
}

module.exports = { previewExport };
