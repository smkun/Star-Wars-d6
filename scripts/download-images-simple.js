#!/usr/bin/env node
/**
 * Simple image downloader for d6 Holocron species
 * Downloads original format first, conversion done separately
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'http://d6holocron.com/wiki/api.php';
const INPUT_PATH = path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'import-ready.json');
const RAW_DIR = path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'raw');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'images');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchImageUrl(filename) {
  const url = new URL(API_URL);
  url.searchParams.set('action', 'query');
  url.searchParams.set('titles', `File:${filename}`);
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Star-Wars-d6-Species-Catalog/1.0',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const pages = data.query?.pages;
  if (!pages) return null;

  const page = Object.values(pages)[0];
  if (page.missing !== undefined || !page.imageinfo?.[0]) {
    return null;
  }

  return page.imageinfo[0].url;
}

function extractImageFilename(wikitext) {
  const match = wikitext.match(/\[\[(File|Image):([^\|\]]+)/i);
  return match ? match[2].trim() : null;
}

function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[''`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function downloadFile(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Input file not found: ${INPUT_PATH}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  const species = data.species || [];

  console.log(`🖼️  Downloading images for ${species.length} species...\n`);

  const rawFiles = fs.existsSync(RAW_DIR) ? fs.readdirSync(RAW_DIR) : [];

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const speciesData of species) {
    const slug = slugify(speciesData.name);

    // Find corresponding raw file
    const rawFile = rawFiles.find(f => f.includes(slug));
    if (!rawFile) {
      console.log(`⏭️  ${speciesData.name}: No raw wikitext file found`);
      skipped++;
      continue;
    }

    const rawPath = path.join(RAW_DIR, rawFile);
    const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
    const imageFilename = extractImageFilename(rawData.wikitext || '');

    if (!imageFilename) {
      console.log(`⏭️  ${speciesData.name}: No image in wikitext`);
      skipped++;
      continue;
    }

    const ext = path.extname(imageFilename);
    const outputPath = path.join(OUTPUT_DIR, `${slug}${ext}`);

    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  ${speciesData.name}: Already downloaded`);
      skipped++;
      continue;
    }

    console.log(`📥 ${speciesData.name}: ${imageFilename}...`);

    const imageUrl = await fetchImageUrl(imageFilename);
    if (!imageUrl) {
      console.log(`   ❌ Not found on wiki`);
      failed++;
      await sleep(200);
      continue;
    }

    const success = await downloadFile(imageUrl, outputPath);
    if (success) {
      console.log(`   ✅ ${slug}${ext}`);
      downloaded++;
    } else {
      console.log(`   ❌ Download failed`);
      failed++;
    }

    await sleep(300);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Downloaded: ${downloaded}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`\nImages saved to: ${OUTPUT_DIR}`);

  if (downloaded > 0) {
    console.log(`\n💡 Next: Convert to WebP with:`);
    console.log(`   cd "${OUTPUT_DIR}"`);
    console.log(`   for f in *.{jpg,png,gif}; do convert "$f" "\${f%.*}.webp" && rm "$f"; done`);
  }
}

main().catch(console.error);
