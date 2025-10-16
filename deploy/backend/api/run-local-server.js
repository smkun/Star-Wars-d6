#!/usr/bin/env node
/* api/run-local-server.js */

const http = require('http');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { parse } = require('url');
const path = require('path');
const dotenv = require('dotenv');

// [ADDED] Boot-time env visibility (safe to keep; remove later if noisy)
console.log('BOOT env:', {
  PORT: process.env.PORT,
  PASSENGER_BASE_URI: process.env.PASSENGER_BASE_URI,
  PASSENGER_APP_ENV: process.env.PASSENGER_APP_ENV
}); // [ADDED]
console.log('BOOT:', { PORT: process.env.PORT, BASE: process.env.PASSENGER_BASE_URI }); // [ADDED]

// Load environment variables from .env / .env.production if present
const envCandidates = [
  process.env.DOTENV_PATH,
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../.env.production'),
];

envCandidates
  .filter(Boolean)
  .forEach((candidate) => {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false });
    }
  });

// Fallback to default lookup if nothing loaded yet
dotenv.config({ override: false });

// Firebase Admin helper (optional - used when GOOGLE_APPLICATION_CREDENTIALS
// or FIREBASE_SERVICE_ACCOUNT is provided in the environment)
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const alias =
    process.env.GOOGLE_APP_CRED || process.env.FIREBASE_CREDENTIALS_PATH;
  if (alias) process.env.GOOGLE_APPLICATION_CREDENTIALS = alias;
}

let firebaseAdmin = null;
try {
  firebaseAdmin = require('./firebaseAdmin');
} catch (e) {
  // firebaseAdmin is optional until you want to enable Firebase Auth verification
  console.warn(
    'firebaseAdmin helper not available, Firebase verification disabled until installed.'
  );
}

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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

function notFound(res) {
  json(res, { error: 'not_found' }, 404);
}

const server = http.createServer(async (req, res) => {
  // [ADDED] Per-request log so we can see the exact path Passenger handed us
  console.log('REQ', req.method, req.url); // [ADDED]

  try {
    // [ADDED] Normalize path when Passenger doesn't strip BaseURI
const baseUri = process.env.PASSENGER_BASE_URI || '';
let urlPath = req.url || '/';
try {
  // get a clean pathname (no query) in case req.url has a querystring
  urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
} catch (_) {}

if (baseUri && urlPath.startsWith(baseUri)) {
  urlPath = urlPath.slice(baseUri.length) || '/';
}
console.log('PATH', { baseUri, raw: req.url, normalized: urlPath }); // [ADDED]

// Use the normalized path for routing
const pathname = urlPath;


    // [ADDED] Minimal health endpoint (helps cPanel/you confirm green)
    if (req.method === 'GET' && (pathname === '/' || pathname === '/healthz')) { // [ADDED]
      res.writeHead(200, { 'Content-Type': 'text/plain' });                      // [ADDED]
      return res.end('ok');                                                       // [ADDED]
    }                                                                             // [ADDED]

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      });
      res.end();
      return;
    }

    // Helper: resolve auth info from Authorization header using Firebase Admin
    // Returns an object: { uid, admin (bool), claims }
    async function resolveAuthInfo() {
      const auth = (req.headers && req.headers.authorization) || '';
      if (!auth.startsWith('Bearer ')) return null;
      const token = auth.slice('Bearer '.length).trim();

      // If firebaseAdmin helper is present and GOOGLE_APPLICATION_CREDENTIALS or
      // FIREBASE_SERVICE_ACCOUNT is provided, verify via Firebase.
      if (
        firebaseAdmin &&
        (process.env.GOOGLE_APPLICATION_CREDENTIALS ||
          process.env.FIREBASE_SERVICE_ACCOUNT)
      ) {
        try {
          const decoded = await firebaseAdmin.verifyIdToken(token);
          return {
            uid: decoded.uid,
            admin:
              !!decoded.admin || !!(decoded.claims && decoded.claims.admin),
            claims: decoded,
          };
        } catch (e) {
          console.warn('Failed to verify Firebase ID token:', e && e.message);
          return null;
        }
      }

      // Dev-mode fallback: accept dev:<uid> when DEV_AUTH=true and treat dev-admin if dev-admin:<uid>
      if (process.env.DEV_AUTH === 'true' && token.startsWith('dev:')) {
        const uid = token.slice('dev:'.length);
        const admin = token.startsWith('dev-admin:');
        return { uid, admin, claims: {} };
      }

      return null;
    }

    if (pathname === '/species' && req.method === 'GET') {
      try { // [ADDED] guard so we log JSON errors cleanly
        const rows = await queryRows(
          'SELECT slug, name, classification, homeworld, description, properties, imageUrl FROM species ORDER BY name LIMIT 1000'
        );
        const out = rows.map((row) => {
          let props = {};
          try {
            props =
              typeof row.properties === 'string'
                ? JSON.parse(row.properties || '{}')
                : row.properties || {};
          } catch (e) {
            console.error('Bad JSON in species.properties for slug', row.slug, e.message); // [ADDED]
          }
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
      } catch (err) {
        console.error('SPECIES_QUERY_FAIL:', err && err.message, err && err.stack); // [ADDED]
        return json(res, { error: 'species_query_failed' }, 500);                   // [ADDED]
      }
    }

    // Admin-only: List all Firebase users
    if (pathname === '/users' && req.method === 'GET') {
      const authInfo = await resolveAuthInfo();
      if (!authInfo) return json(res, { error: 'unauthorized' }, 401);
      if (!authInfo.admin) return json(res, { error: 'admin_required' }, 403);

      // Fetch all users from Firebase Auth
      if (!firebaseAdmin || !(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT)) {
        return json(res, { error: 'firebase_admin_not_configured' }, 500);
      }

      try {
        firebaseAdmin.ensureInitialized();
        const admin = require('firebase-admin');
        const listUsersResult = await admin.auth().listUsers();

        const users = listUsersResult.users.map(user => ({
          uid: user.uid,
          email: user.email || 'No email',
          displayName: user.displayName || user.email || 'Unknown',
        }));

        return json(res, users);
      } catch (err) {
        console.error('Error listing users:', err);
        return json(res, { error: 'failed_to_list_users' }, 500);
      }
    }

    // Characters endpoints (CRUD) — require authentication
    if (pathname === '/characters' && req.method === 'GET') {
      const authInfo = await resolveAuthInfo();
      if (!authInfo) return json(res, { error: 'unauthorized' }, 401);

      // support ?all=true for admins
      const url = new URL(req.url, `http://${req.headers.host}`);
      const all = url.searchParams.get('all') === 'true';

      let rows;
      if (all && authInfo.admin) {
        rows = await queryRows(
          'SELECT id, user_id, name, species_slug, image, data, created_at, updated_at FROM characters ORDER BY updated_at DESC'
        );
      } else {
        rows = await queryRows(
          'SELECT id, user_id, name, species_slug, image, data, created_at, updated_at FROM characters WHERE user_id = ? ORDER BY updated_at DESC',
          [authInfo.uid]
        );
      }

      const out = rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        name: r.name,
        species_slug: r.species_slug,
        image: r.image,
        data:
          typeof r.data === 'string'
            ? JSON.parse(r.data || '{}')
            : r.data || {},
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      return json(res, out);
    }

    if (pathname === '/characters' && req.method === 'POST') {
      const authInfo = await resolveAuthInfo();
      if (!authInfo) return json(res, { error: 'unauthorized' }, 401);

      const userId = authInfo.uid;

      let body = '';
      for await (const chunk of req) body += chunk;
      const payload = JSON.parse(body || '{}');

      const uuid = require('crypto').randomUUID();
      const name = payload.name || 'Unnamed';
      const species = payload.species_slug || null;
      const image = payload.image || null;
      const data = JSON.stringify(payload.data || {});

      await queryRows(
        'INSERT INTO characters (id, user_id, name, species_slug, image, data) VALUES (?, ?, ?, ?, ?, ?)',
        [uuid, userId, name, species, image, data]
      );

      const created = {
        id: uuid,
        user_id: userId,
        name,
        species_slug: species,
        image,
        data: JSON.parse(data),
      };
      return json(res, created, 201);
    }

    const characterMatch = pathname?.match(/^\/characters\/(.+)$/);
    if (characterMatch) {
      const charId = decodeURIComponent(characterMatch[1]);
      if (req.method === 'GET') {
        const authInfo = await resolveAuthInfo();
        if (!authInfo) return json(res, { error: 'unauthorized' }, 401);

        const userId = authInfo.uid;

        const rows = await queryRows(
          'SELECT * FROM characters WHERE id = ? LIMIT 1',
          [charId]
        );
        const row = rows && rows[0];
        if (!row) return notFound(res);
        if (row.user_id !== userId && !authInfo.admin)
          return json(res, { error: 'forbidden' }, 403);

        const out = {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          species_slug: row.species_slug,
          image: row.image,
          data:
            typeof row.data === 'string'
              ? JSON.parse(row.data || '{}')
              : row.data || {},
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
        return json(res, out);
      }

      if (req.method === 'PUT') {
        const authInfo = await resolveAuthInfo();
        if (!authInfo) return json(res, { error: 'unauthorized' }, 401);

        const userId = authInfo.uid;

        const rows = await queryRows(
          'SELECT user_id, image FROM characters WHERE id = ? LIMIT 1',
          [charId]
        );
        const row = rows && rows[0];
        if (!row) return notFound(res);
        if (row.user_id !== userId && !authInfo.admin)
          return json(res, { error: 'forbidden' }, 403);

        let body = '';
        for await (const chunk of req) body += chunk;
        const payload = JSON.parse(body || '{}');

        const name = payload.name || row.name;
        const species = payload.species_slug || row.species_slug;
        const image = payload.image !== undefined ? payload.image : row.image;
        const data = JSON.stringify(payload.data || {});

        await queryRows(
          'UPDATE characters SET name = ?, species_slug = ?, image = ?, data = ? WHERE id = ?',
          [name, species, image, data, charId]
        );
        return json(res, { success: true });
      }

      if (req.method === 'DELETE') {
        const authInfo = await resolveAuthInfo();
        if (!authInfo) return json(res, { error: 'unauthorized' }, 401);

        const userId = authInfo.uid;

        const rows = await queryRows(
          'SELECT user_id FROM characters WHERE id = ? LIMIT 1',
          [charId]
        );
        const row = rows && rows[0];
        if (!row) return notFound(res);
        if (row.user_id !== userId && !authInfo.admin)
          return json(res, { error: 'forbidden' }, 403);

        await queryRows('DELETE FROM characters WHERE id = ?', [charId]);
        return json(res, { success: true });
      }

      if (req.method === 'PATCH') {
        const authInfo = await resolveAuthInfo();
        if (!authInfo) return json(res, { error: 'unauthorized' }, 401);

        // Only admins can change ownership
        if (!authInfo.admin)
          return json(res, { error: 'admin_required' }, 403);

        const rows = await queryRows(
          'SELECT id FROM characters WHERE id = ? LIMIT 1',
          [charId]
        );
        const row = rows && rows[0];
        if (!row) return notFound(res);

        let body = '';
        for await (const chunk of req) body += chunk;
        const payload = JSON.parse(body || '{}');

        const newUserId = payload.user_id;
        if (!newUserId) {
          return json(res, { error: 'user_id required' }, 400);
        }

        await queryRows(
          'UPDATE characters SET user_id = ? WHERE id = ?',
          [newUserId, charId]
        );
        return json(res, { success: true, user_id: newUserId });
      }
    }

    const speciesMatch = pathname?.match(/^\/species\/(.+)$/);
    if (speciesMatch && req.method === 'GET') {
      const slug = decodeURIComponent(speciesMatch[1]);
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
        physicalDescription: row.physicalDescription,
        adventurers: row.adventurers,
        languages: row.languages,
        hasImage: Boolean(row.imageUrl),
        imagePath: row.imageUrl,
        imageUrl: row.imageUrl,
      };
      return json(res, out);
    }

    // Starships list endpoint
    if (pathname === '/starships' && req.method === 'GET') {
      const rows = await queryRows(
        `SELECT slug, name, craft, affiliation, type, category, parent, isVariant, scale, length, crew, hyperdrive,
          maneuverability, space, hull, shields, imageUrl, imageFilename, weapons_json, sensors_json
         FROM starships ORDER BY name LIMIT 1000`
      );
      const out = rows.map((row) => ({
        id: row.slug,
        slug: row.slug,
        name: row.name,
        craft: row.craft,
        affiliation: row.affiliation,
        type: row.type,
        category: row.category,
        parent: row.parent || null,
        isVariant: Boolean(row.isVariant),
        scale: row.scale,
        length: row.length,
        crew: row.crew,
        hyperdrive: row.hyperdrive,
        maneuverability: row.maneuverability,
        space: row.space,
        hull: row.hull,
        shields: row.shields,
        imageUrl: (row.imageUrl && row.imageUrl.startsWith('/')) ? row.imageUrl : (row.imageFilename ? `/d6StarWars/starships/${row.imageFilename}` : null),
        weapons: row.weapons_json ? JSON.parse(row.weapons_json) : [],
        sensors: row.sensors_json ? JSON.parse(row.sensors_json) : null,
      }));
      return json(res, out);
    }

    // Starship detail endpoint
    const starshipMatch = pathname?.match(/^\/starships\/(.+)$/);
    if (starshipMatch && req.method === 'GET') {
      const slug = decodeURIComponent(starshipMatch[1]);
      const rows = await queryRows(
        `SELECT * FROM starships WHERE slug = ? LIMIT 1`,
        [slug]
      );
      const row = rows && rows[0];
      if (!row) return notFound(res);

      const out = {
        id: row.slug,
        slug: row.slug,
        name: row.name,
        craft: row.craft,
        affiliation: row.affiliation,
        type: row.type,
        category: row.category,
        scale: row.scale,
        length: row.length,
        skill: row.skill,
        crew: row.crew,
        crewSkill: row.crewSkill,
        passengers: row.passengers,
        cargoCapacity: row.cargoCapacity,
        consumables: row.consumables,
        cost: row.cost,
        hyperdrive: row.hyperdrive,
        navComputer: row.navComputer,
        maneuverability: row.maneuverability,
        space: row.space,
        atmosphere: row.atmosphere,
        hull: row.hull,
        shields: row.shields,
        description: row.description,
        imageUrl: (row.imageUrl && row.imageUrl.startsWith('/')) ? row.imageUrl : (row.imageFilename ? `/d6StarWars/starships/${row.imageFilename}` : null),
        weapons: row.weapons_json ? JSON.parse(row.weapons_json) : [],
        sensors: row.sensors_json ? JSON.parse(row.sensors_json) : null,
        sources: row.sources_json ? JSON.parse(row.sources_json) : [],
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

// [CHANGED] Passenger-safe port selection
const isPassenger = !!(process.env.PASSENGER_BASE_URI || process.env.PASSENGER_APP_ENV); // [ADDED]
// Under Passenger: use its PORT if provided, else fall back to 3000 (common on this host).
// Locally: default to 4000 if PORT isn’t set.
const PORT = isPassenger ? Number(process.env.PORT || 3000) : Number(process.env.PORT || 4000); // [ADDED]

server.listen(PORT, () => console.log('Local API listening on', PORT, 'isPassenger=', isPassenger)); // [CHANGED]
console.log('PID', process.pid, 'listening on PORT=', PORT); // [CHANGED]
