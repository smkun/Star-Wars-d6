#!/usr/bin/env node
const http = require('http');
const mysql = require('mysql2/promise');
const { parse } = require('url');

const MYSQL_URL = process.env.MYSQL_URL;
if (!MYSQL_URL) {
  console.error('Please set MYSQL_URL');
  process.exit(2);
}

async function queryRows(sql, params) {
  const conn = await mysql.createConnection(MYSQL_URL);
  try {
    const [rows] = await conn.query(sql, params || []);
    return rows;
  } finally {
    await conn.end();
  }
}

function json(res, obj, code = 200) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function notFound(res) {
  json(res, { error: 'not_found' }, 404);
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = parse(req.url || '', true);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      });
      res.end();
      return;
    }

    if (pathname === '/species' && req.method === 'GET') {
      const rows = await queryRows(
        'SELECT slug, name, classification, homeworld, description, properties, imageUrl FROM species ORDER BY name LIMIT 1000'
      );
      const out = rows.map((row) => {
        const props =
          typeof row.properties === 'string'
            ? JSON.parse(row.properties || '{}')
            : row.properties || {};

        return {
          slug: row.slug,
          name: row.name,
          classification: row.classification,
          homeworld: row.homeworld,
          description: row.description,
          sources: props.sources || [],
          stats: props.stats || {},
          specialAbilities: props.specialAbilities || [],
          storyFactors: props.storyFactors || [],
          personality: props.personality,
          physicalDescription: props.physicalDescription,
          adventurers: props.adventurers,
          languages: props.languages,
          hasImage: Boolean(row.imageUrl),
          imagePath: row.imageUrl,
          imageUrl: row.imageUrl,
        };
      });
      return json(res, out);
    }

    const m = pathname?.match(/^\/species\/(.+)$/);
    if (m && req.method === 'GET') {
      const slug = decodeURIComponent(m[1]);
      const rows = await queryRows(
        'SELECT slug, name, classification, homeworld, description, properties, imageUrl FROM species WHERE slug = ? LIMIT 1',
        [slug]
      );
      const row = rows && rows[0];
      if (!row) return notFound(res);

      const props =
        typeof row.properties === 'string'
          ? JSON.parse(row.properties || '{}')
          : row.properties || {};

      const out = {
        slug: row.slug,
        name: row.name,
        classification: row.classification,
        homeworld: row.homeworld,
        description: row.description,
        sources: props.sources || [],
        stats: props.stats || {},
        specialAbilities: props.specialAbilities || [],
        storyFactors: props.storyFactors || [],
        personality: props.personality,
        physicalDescription: props.physicalDescription,
        adventurers: props.adventurers,
        languages: props.languages,
        hasImage: Boolean(row.imageUrl),
        imagePath: row.imageUrl,
        imageUrl: row.imageUrl,
      };
      return json(res, out);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  } catch (e) {
    console.error(e);
    json(res, { error: 'internal' }, 500);
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('Local API listening on', PORT));
