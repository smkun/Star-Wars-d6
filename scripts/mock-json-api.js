#!/usr/bin/env node
const http = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '..', 'ALIENS.json');
let aliens = null;
try {
  aliens = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
} catch (e) {
  console.error('Failed to read ALIENS.json:', e.message);
  process.exit(1);
}
const races = aliens.races || [];

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

const server = http.createServer((req, res) => {
  const { pathname } = parse(req.url || '', true);
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
    const out = races.map((r) => ({
      slug:
        r.slug ||
        (r.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      name: r.name,
      classification: r.classification,
      homeworld: r.homeworld,
      description: r.description,
      sources: r.sources || [],
      stats: r.stats || {},
      specialAbilities: r.specialAbilities || [],
      storyFactors: r.storyFactors || [],
      personality: r.personality,
      physicalDescription: r.physicalDescription,
      adventurers: r.adventurers,
      languages: r.languages,
      hasImage: r.hasImage || false,
      imagePath: r.imagePath || null,
      imageUrl: r.imagePath || null,
    }));
    return json(res, out);
  }

  const speciesMatch = pathname && pathname.match(/^\/species\/(.+)$/);
  if (speciesMatch && req.method === 'GET') {
    const slug = decodeURIComponent(speciesMatch[1]);
    const r = races.find(
      (x) =>
        (x.slug || (x.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')) ===
        slug
    );
    if (!r) return json(res, { error: 'not_found' }, 404);
    const out = Object.assign({}, r, {
      slug: r.slug || slug,
      hasImage: Boolean(r.imagePath),
      imagePath: r.imagePath || null,
      imageUrl: r.imagePath || null,
    });
    return json(res, out);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('Mock JSON API listening on', PORT));
