#!/usr/bin/env node

/**
 * Link starship images to database records
 * Matches image files in web/public/starships/ to starships in MySQL database
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MYSQL_URL = process.env.MYSQL_URL;
const IMAGES_DIR = path.join(__dirname, '..', 'web', 'public', 'starships');

if (!MYSQL_URL) {
  console.error('❌ Error: MYSQL_URL environment variable not set');
  console.log('Usage: export MYSQL_URL="mysql://user:pass@host:3306/db" && node scripts/link-starship-images.js');
  process.exit(1);
}

async function linkImages() {
  let connection;
  try {
    // Connect to MySQL
    connection = await mysql.createConnection(MYSQL_URL);
    console.log('✅ Connected to MySQL database');

    // Read all image files
    const imageFiles = fs.readdirSync(IMAGES_DIR).filter(f =>
      f.endsWith('.jpg') || f.endsWith('.webp') || f.endsWith('.png')
    );
    console.log(`📁 Found ${imageFiles.length} image files in ${IMAGES_DIR}`);

    // Get all starships
    const [starships] = await connection.execute(
      'SELECT slug, name, imageFilename, imageUrl FROM starships'
    );
    console.log(`🚀 Found ${starships.length} starships in database`);

    let matchedCount = 0;
    let updatedCount = 0;
    const unmatched = [];

    // Try to match each starship to an image
    for (const ship of starships) {
      let matchedImage = null;

      // Strategy 1: Use existing imageFilename if it exists
      if (ship.imageFilename && imageFiles.includes(ship.imageFilename)) {
        matchedImage = ship.imageFilename;
      }

      // Strategy 2: Try slug-based filename patterns
      if (!matchedImage) {
        const slugVariations = [
          `${ship.slug}.jpg`,
          `${ship.slug}.webp`,
          `${ship.slug}.png`,
          `${ship.slug.replace(/-/g, '')}.jpg`,
          `${ship.slug.replace(/-/g, '')}.webp`,
          `${ship.slug.replace(/-/g, '')}.png`,
        ];

        for (const variation of slugVariations) {
          if (imageFiles.includes(variation)) {
            matchedImage = variation;
            break;
          }
        }
      }

      // Strategy 3: Try name-based matching (case-insensitive, remove special chars)
      if (!matchedImage) {
        const normalizedName = ship.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

        for (const imageFile of imageFiles) {
          const normalizedImage = imageFile
            .replace(/\.(jpg|webp|png)$/, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

          if (normalizedImage === normalizedName) {
            matchedImage = imageFile;
            break;
          }
        }
      }

      if (matchedImage) {
        matchedCount++;

        // Only update if imageUrl is currently NULL or different
        if (!ship.imageUrl || ship.imageUrl !== matchedImage) {
          await connection.execute(
            'UPDATE starships SET imageUrl = ? WHERE slug = ?',
            [matchedImage, ship.slug]
          );
          updatedCount++;
          console.log(`  ✓ ${ship.name} → ${matchedImage}`);
        }
      } else {
        unmatched.push(ship.name);
      }
    }

    console.log('\n📊 Results:');
    console.log(`  ✅ Matched: ${matchedCount} starships`);
    console.log(`  🔄 Updated: ${updatedCount} database records`);
    console.log(`  ⚠️  Unmatched: ${unmatched.length} starships`);

    if (unmatched.length > 0 && unmatched.length <= 20) {
      console.log('\n❌ Unmatched starships:');
      unmatched.forEach(name => console.log(`  - ${name}`));
    } else if (unmatched.length > 20) {
      console.log(`\n⚠️  Too many unmatched (${unmatched.length}) to display`);
    }

    // Show category breakdown
    const [categoryStats] = await connection.execute(`
      SELECT
        category,
        COUNT(*) as total,
        SUM(CASE WHEN imageUrl IS NOT NULL THEN 1 ELSE 0 END) as with_images
      FROM starships
      GROUP BY category
    `);

    console.log('\n📈 Category Breakdown:');
    categoryStats.forEach(stat => {
      console.log(`  ${stat.category}: ${stat.with_images}/${stat.total} with images`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

linkImages();
