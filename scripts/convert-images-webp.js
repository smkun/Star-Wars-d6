#!/usr/bin/env node
/**
 * Convert downloaded images to WebP using sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGE_DIR = path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'images');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'web', 'public', 'aliens');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function convertImage(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const files = fs.readdirSync(IMAGE_DIR).filter(f =>
    /\.(jpg|jpeg|png|gif)$/i.test(f)
  );

  console.log(`🔄 Converting ${files.length} images to WebP...\n`);

  let converted = 0;
  let failed = 0;

  for (const file of files) {
    const inputPath = path.join(IMAGE_DIR, file);
    const basename = path.basename(file, path.extname(file));
    const outputPath = path.join(OUTPUT_DIR, `${basename}.webp`);

    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  ${file} (already exists)`);
      continue;
    }

    process.stdout.write(`📸 ${file} → ${basename}.webp...`);

    const success = await convertImage(inputPath, outputPath);
    if (success) {
      console.log(` ✅`);
      converted++;
    } else {
      console.log(` ❌`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Converted: ${converted}`);
  console.log(`   Failed: ${failed}`);
  console.log(`\nWebP images saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
