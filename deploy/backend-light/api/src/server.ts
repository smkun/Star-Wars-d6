import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const MYSQL_URL = process.env.MYSQL_URL;
if (!MYSQL_URL) {
  console.warn('MYSQL_URL not set; API will fail if called');
}

async function withConn(fn: (conn: mysql.Connection) => Promise<any>) {
  const conn = await mysql.createConnection(MYSQL_URL as string);
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

app.get('/species', async (req, res) => {
  try {
    const rows = await withConn(async (conn) => {
      const [r] = await conn.query(
        'SELECT slug, name, classification, homeworld, description, properties, imageUrl FROM species ORDER BY name LIMIT 1000'
      );
      return r as any[];
    });

    // parse properties JSON where present
    const out = rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      classification: row.classification,
      homeworld: row.homeworld,
      description: row.description,
      properties:
        typeof row.properties === 'string'
          ? JSON.parse(row.properties || '{}')
          : row.properties || {},
      imageUrl: row.imageUrl,
    }));

    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

app.get('/species/:slug', async (req, res) => {
  const slug = req.params.slug;
  try {
    const row = await withConn(async (conn) => {
      const [r] = await conn.query(
        'SELECT slug, name, classification, homeworld, description, properties, imageUrl FROM species WHERE slug = ? LIMIT 1',
        [slug]
      );
      return (r as any[])[0];
    });
    if (!row) return res.status(404).json({ error: 'not_found' });
    const out = {
      slug: row.slug,
      name: row.name,
      classification: row.classification,
      homeworld: row.homeworld,
      description: row.description,
      properties:
        typeof row.properties === 'string'
          ? JSON.parse(row.properties || '{}')
          : row.properties || {},
      imageUrl: row.imageUrl,
    };
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API server listening on ${PORT}`));
