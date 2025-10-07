#!/usr/bin/env node
/**
 * Downloads images from d6 Holocron MediaWiki for species
 * Usage: node scripts/download-holocron-images.js [--input=path]
 */

const fs = require('fs');
const { writeFileSync, existsSync, mkdirSync } = fs;
const path = require('path');
const { execSync } = require('child_process');

const API_URL = 'http://d6holocron.com/wiki/api.php';
const args = process.argv.slice(2);
const inputArg = args.find((arg) => arg.startsWith('--input='));
const INPUT_PATH = inputArg
  ? path.resolve(process.cwd(), inputArg.split('=')[1])
  : path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'import-ready.json');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'web', 'public', 'aliens');

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
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
      'User-Agent': 'Star-Wars-d6-Species-Catalog/1.0 (+https://d6holocron.com; CC-BY-SA compliance)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image info for ${filename}: ${response.statusText}`);
  }

  const data = await response.json();
  const pages = data.query?.pages;
  if (!pages) {
    return null;
  }

  const page = Object.values(pages)[0];
  if (page.missing !== undefined || !page.imageinfo || !page.imageinfo[0]) {
    return null;
  }

  return page.imageinfo[0].url;
}

function extractImageFilename(wikitext) {
  // Match [[File:filename.ext|...]] or [[Image:filename.ext|...]]
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

async function downloadImage(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const tempPath = `${outputPath}.temp`;
    fs.writeFileSync(tempPath, Buffer.from(buffer));

    // Convert to WebP using sharp or imagemagick
    try {
      // Try sharp first (faster)
      execSync(`npx sharp-cli --input "${tempPath}" --output "${outputPath}" --webp`, {
        stdio: 'pipe'
      });
    } catch {
      // Fallback to imagemagick
      try {
        execSync(`convert "${tempPath}" "${outputPath}"`, {
          stdio: 'pipe'
        });
      } catch {
        // If neither works, just copy the file and rename
        fs.renameSync(tempPath, outputPath.replace('.webp', path.extname(tempPath)));
        return false;
      }
    }

    // Clean up temp file
    if (existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    return true;
  } catch (error) {
    console.error(`Failed to download ${url}: ${error.message}`);
    return false;
  }
}

async function main() {
  if (!existsSync(INPUT_PATH)) {
    console.error(`Input file not found: ${INPUT_PATH}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  const species = data.species || [];

  console.log(`🖼️  Downloading images for ${species.length} species...\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  // Also check raw wikitext files for image references
  const rawDir = path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'raw');
  const rawFiles = existsSync(rawDir) ? fs.readdirSync(rawDir) : [];

  for (const speciesData of species) {
    const slug = slugify(speciesData.name);
    const outputPath = path.join(OUTPUT_DIR, `${slug}.webp`);

    // Skip if already exists
    if (existsSync(outputPath)) {
      skipped++;
      continue;
    }

    // Try to find the raw wikitext file
    const rawFile = rawFiles.find(f => f.includes(slug) || f.includes(speciesData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')));
    let imageFilename = null;

    if (rawFile) {
      const rawPath = path.join(rawDir, rawFile);
      const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
      imageFilename = extractImageFilename(rawData.wikitext || '');
    }

    if (!imageFilename) {
      console.log(`⏭️  ${speciesData.name}: No image found in wikitext`);
      skipped++;
      continue;
    }

    console.log(`📥 ${speciesData.name}: Fetching ${imageFilename}...`);

    try {
      const imageUrl = await fetchImageUrl(imageFilename);
      if (!imageUrl) {
        console.log(`   ⚠️  Image not found on wiki`);
        failed++;
        await sleep(200);
        continue;
      }

      const success = await downloadImage(imageUrl, outputPath);
      if (success) {
        console.log(`   ✅ Downloaded to ${slug}.webp`);
        downloaded++;
      } else {
        console.log(`   ❌ Download failed`);
        failed++;
      }

      await sleep(300); // Rate limiting
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Downloaded: ${downloaded}`);
  console.log(`   Skipped (already exists): ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`\nImages saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
