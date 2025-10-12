const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const MYSQL_URL = process.env.MYSQL_URL;
const IMAGES_DIR = path.join(__dirname, '../web/public/aliens');

async function linkImages() {
  if (!MYSQL_URL) {
    console.error('MYSQL_URL environment variable not set');
    process.exit(1);
  }

  const conn = await mysql.createConnection(MYSQL_URL);

  // Get all image files
  const imageFiles = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'));
  console.log(`Found ${imageFiles.length} image files`);

  let linked = 0;

  for (const imageFile of imageFiles) {
    const basename = path.basename(imageFile, '.webp');

    // Update species with matching slug
    const [result] = await conn.execute(
      `UPDATE species SET imageUrl = ? WHERE slug = ?`,
      [`/images/${imageFile}`, basename]
    );

    if (result.affectedRows > 0) {
      console.log(`Linked ${imageFile} to species ${basename}`);
      linked++;
    }
  }

  console.log(`\nLinked ${linked} images`);
  await conn.end();
}

linkImages().catch(console.error);
