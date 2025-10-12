#!/usr/bin/env node

/**
 * Download capital ship images from d6 Holocron
 * Fetches missing capital ship images and saves them to web/public/starships/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const mysql = require('mysql2/promise');

const MYSQL_URL = process.env.MYSQL_URL;
const IMAGES_DIR = path.join(__dirname, '..', 'web', 'public', 'starships');
const API_URL = 'http://d6holocron.com/wiki/api.php';

if (!MYSQL_URL) {
  console.error('❌ Error: MYSQL_URL environment variable not set');
  console.log('Usage: export MYSQL_URL="mysql://user:pass@host:3306/db" && node scripts/download-capital-ship-images.js');
  process.exit(1);
}

// Create images directory if it doesn't exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log(`✅ Created directory: ${IMAGES_DIR}`);
}

/**
 * Fetch image URL from MediaWiki API
 */
async function fetchImageUrl(filename) {
  if (!filename) return null;

  const url = `${API_URL}?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;

  return new Promise((resolve) => {
    http.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query?.pages;
          if (!pages) return resolve(null);

          const page = Object.values(pages)[0];
          const imageUrl = page.imageinfo?.[0]?.url || null;
          resolve(imageUrl);
        } catch (err) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

/**
 * Download a file from URL to destination
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);

    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        file.close();
        fs.unlinkSync(dest);
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

/**
 * Try to download image using MediaWiki API
 */
async function tryDownloadImage(imageFilename, shipName) {
  const destPath = path.join(IMAGES_DIR, imageFilename);

  // Skip if file already exists
  if (fs.existsSync(destPath)) {
    return { success: true, cached: true };
  }

  try {
    // Get the correct image URL from MediaWiki API
    const imageUrl = await fetchImageUrl(imageFilename);

    if (!imageUrl) {
      return { success: false, error: 'Image not found in wiki' };
    }

    // Download the image
    await downloadFile(imageUrl, destPath);
    return { success: true, url: imageUrl };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function downloadCapitalShipImages() {
  let connection;

  try {
    // Connect to MySQL
    connection = await mysql.createConnection(MYSQL_URL);
    console.log('✅ Connected to MySQL database\n');

    // Get all capital ships without images
    const TEST_LIMIT = process.argv[2] === '--test' ? 5 : null;
    const limitClause = TEST_LIMIT ? `LIMIT ${TEST_LIMIT}` : '';

    const [capitalShips] = await connection.execute(`
      SELECT slug, name, imageFilename
      FROM starships
      WHERE category = 'capital' AND imageUrl IS NULL AND imageFilename IS NOT NULL
      ORDER BY name
      ${limitClause}
    `);

    console.log(`📥 Found ${capitalShips.length} capital ships needing images\n`);

    let downloaded = 0;
    let cached = 0;
    let failed = 0;
    const failedShips = [];

    // Download images with progress
    for (let i = 0; i < capitalShips.length; i++) {
      const ship = capitalShips[i];
      const progress = `[${i + 1}/${capitalShips.length}]`;

      process.stdout.write(`${progress} ${ship.name}... `);

      const result = await tryDownloadImage(ship.imageFilename, ship.name);

      if (result.success) {
        if (result.cached) {
          console.log('✓ (cached)');
          cached++;
        } else {
          console.log('✓');
          downloaded++;
        }

        // Update database
        await connection.execute(
          'UPDATE starships SET imageUrl = ? WHERE slug = ?',
          [ship.imageFilename, ship.slug]
        );
      } else {
        console.log('✗ failed');
        failed++;
        failedShips.push({ name: ship.name, filename: ship.imageFilename });
      }

      // Rate limiting: wait 500ms between downloads
      if (i < capitalShips.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Download Summary:');
    console.log(`  ✅ Downloaded: ${downloaded} images`);
    console.log(`  ♻️  Cached: ${cached} images`);
    console.log(`  ❌ Failed: ${failed} images`);
    console.log('='.repeat(60));

    if (failedShips.length > 0) {
      console.log('\n❌ Failed Downloads:');
      failedShips.forEach(ship => {
        console.log(`  - ${ship.name} (${ship.filename})`);
      });
      console.log('\nThese images may need to be downloaded manually from:');
      console.log('https://d6holocron.com/wiki/');
    }

    // Final statistics
    const [stats] = await connection.execute(`
      SELECT
        category,
        COUNT(*) as total,
        SUM(CASE WHEN imageUrl IS NOT NULL THEN 1 ELSE 0 END) as with_images
      FROM starships
      GROUP BY category
    `);

    console.log('\n📈 Current Image Coverage:');
    stats.forEach(stat => {
      const percentage = ((stat.with_images / stat.total) * 100).toFixed(1);
      console.log(`  ${stat.category}: ${stat.with_images}/${stat.total} (${percentage}%)`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the download
console.log('🚀 Starting capital ship image download...\n');
downloadCapitalShipImages();
