#!/usr/bin/env node
'use strict';

/**
 * Fetches starship data from d6 Holocron MediaWiki
 * Usage: node scripts/fetch-starships.js --category=starfighters --limit=10
 */

const fs = require('fs');
const { writeFileSync, existsSync, mkdirSync } = fs;
const path = require('path');

const API_URL = 'http://d6holocron.com/wiki/api.php';
const OUTPUT_ROOT = path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'starships');
const RAW_DIR = path.join(OUTPUT_ROOT, 'raw');

const args = process.argv.slice(2);
const categoryArg = args.find((arg) => arg.startsWith('--category='));
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const delayArg = args.find((arg) => arg.startsWith('--delay='));

const CATEGORY = categoryArg ? categoryArg.split('=')[1] : 'starfighters';
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : 10;
const REQUEST_DELAY = delayArg ? Number(delayArg.split('=')[1]) : 400;

// Category mapping
const CATEGORY_MAP = {
  starfighters: { page: 'Starfighters', type: 'starfighter' },
  transports: { page: 'Space Transports', type: 'transport' },
  capital: { page: 'Capital Ships', type: 'capital' },
};

if (!CATEGORY_MAP[CATEGORY]) {
  console.error(`Invalid category: ${CATEGORY}`);
  console.error(`Valid categories: ${Object.keys(CATEGORY_MAP).join(', ')}`);
  process.exit(1);
}

[OUTPUT_ROOT, RAW_DIR].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildUrl = (params) => {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const fetchJson = async (params) => {
  const response = await fetch(buildUrl(params), {
    headers: {
      'User-Agent': 'Star-Wars-d6-Catalog/1.0 (+https://d6holocron.com; CC-BY-SA compliance)',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.json();
};

const fetchCategoryLinks = async (categoryPage) => {
  const data = await fetchJson({
    action: 'parse',
    page: categoryPage,
    prop: 'links',
    format: 'json',
  });

  if (!data.parse || !Array.isArray(data.parse.links)) {
    throw new Error('Unexpected response while fetching category links');
  }

  return data.parse.links
    .filter((link) => link.ns === 0 && link['*'])
    .map((link) => link['*']);
};

const fetchStarshipPage = async (title) => {
  const data = await fetchJson({
    action: 'query',
    prop: 'revisions',
    titles: title,
    rvprop: 'ids|content',
    format: 'json',
  });

  if (!data.query || !data.query.pages) {
    throw new Error(`Missing page data for ${title}`);
  }

  const page = Object.values(data.query.pages)[0];

  if (page.missing !== undefined) {
    throw new Error(`Page "${title}" not found`);
  }

  const revision = page.revisions && page.revisions[0];
  if (!revision || typeof revision['*'] !== 'string') {
    throw new Error(`No wikitext found for ${title}`);
  }

  return {
    title,
    pageId: page.pageid,
    revId: revision.revid,
    wikitext: revision['*'],
  };
};

const stripWikiMarkup = (raw) =>
  raw
    .replace(/\r/g, '')
    .replace(/\[\[([^|\]]+)\|([^|\]]+)\]\]/g, (_, _target, display) => display)
    .replace(/\[\[([^\]]+)\]\]/g, (_, display) => display)
    .replace(/''+/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/{{[^}]+}}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractValue = (wikitext, label) => {
  const pattern = new RegExp(`'''${label}'''\\s*:\\s*([^\\n<]+)`, 'i');
  const match = wikitext.match(pattern);
  if (!match) return null;
  return stripWikiMarkup(match[1]);
};

const extractSensors = (wikitext) => {
  const sensorsSection = wikitext.match(/'''Sensors'''([\s\S]*?)(?='''|$)/i);
  if (!sensorsSection) return null;

  const passive = sensorsSection[1].match(/\*\s*Passive:\s*([^\n]+)/i);
  const scan = sensorsSection[1].match(/\*\s*Scan:\s*([^\n]+)/i);
  const search = sensorsSection[1].match(/\*\s*Search:\s*([^\n]+)/i);
  const focus = sensorsSection[1].match(/\*\s*Focus:\s*([^\n]+)/i);

  return {
    passive: passive ? stripWikiMarkup(passive[1]) : undefined,
    scan: scan ? stripWikiMarkup(scan[1]) : undefined,
    search: search ? stripWikiMarkup(search[1]) : undefined,
    focus: focus ? stripWikiMarkup(focus[1]) : undefined,
  };
};

const extractWeapons = (wikitext) => {
  const weaponsSection = wikitext.match(/'''Weapons'''([\s\S]*?)(?='''Description'''|$)/i);
  if (!weaponsSection) return [];

  const weapons = [];
  const weaponBlocks = weaponsSection[1].split(/\*\s*'''/);

  for (const block of weaponBlocks) {
    if (!block.trim()) continue;

    const nameMatch = block.match(/^([^']+)'''/);
    if (!nameMatch) continue;

    const name = stripWikiMarkup(nameMatch[1]);
    const weapon = { name };

    // Extract weapon properties
    const fireArc = block.match(/Fire Arc:\s*([^\n<]+)/i);
    const scale = block.match(/Scale:\s*([^\n<]+)/i);
    const skill = block.match(/Skill:\s*([^\n<]+)/i);
    const fireControl = block.match(/Fire Control:\s*([^\n<]+)/i);
    const spaceRange = block.match(/Space Range:\s*([^\n<]+)/i);
    const atmosphereRange = block.match(/Atmosphere Range:\s*([^\n<]+)/i);
    const damage = block.match(/Damage:\s*([^\n<]+)/i);

    if (fireArc) weapon.fireArc = stripWikiMarkup(fireArc[1]);
    if (scale) weapon.scale = stripWikiMarkup(scale[1]);
    if (skill) weapon.skill = stripWikiMarkup(skill[1]);
    if (fireControl) weapon.fireControl = stripWikiMarkup(fireControl[1]);
    if (spaceRange) weapon.spaceRange = stripWikiMarkup(spaceRange[1]);
    if (atmosphereRange) weapon.atmosphereRange = stripWikiMarkup(atmosphereRange[1]);
    if (damage) weapon.damage = stripWikiMarkup(damage[1]);

    weapons.push(weapon);
  }

  return weapons;
};

const extractDescription = (wikitext) => {
  const descMatch = wikitext.match(/'''Description''':\s*([\s\S]*?)(?='''|$)/i);
  if (!descMatch) return '';
  return stripWikiMarkup(descMatch[1]);
};

const extractImageFilename = (wikitext) => {
  const match = wikitext.match(/\[\[(File|Image):([^\|\]]+)/i);
  return match ? match[2].trim() : null;
};

const parseStarship = (ship, category) => {
  const name = extractValue(ship.wikitext, 'Name') || ship.title;
  const craft = extractValue(ship.wikitext, 'Craft');
  const affiliation = extractValue(ship.wikitext, 'Affiliation');
  const type = extractValue(ship.wikitext, 'Type');
  const scale = extractValue(ship.wikitext, 'Scale');
  const length = extractValue(ship.wikitext, 'Length');
  const skill = extractValue(ship.wikitext, 'Skill');
  const crew = extractValue(ship.wikitext, 'Crew');
  const crewSkill = extractValue(ship.wikitext, 'Crew Skill');
  const passengers = extractValue(ship.wikitext, 'Passengers');
  const cargoCapacity = extractValue(ship.wikitext, 'Cargo Capacity');
  const consumables = extractValue(ship.wikitext, 'Consumables');
  const cost = extractValue(ship.wikitext, 'Cost');
  const hyperdrive = extractValue(ship.wikitext, 'Hyperdrive');
  const navComputer = extractValue(ship.wikitext, 'Nav Computer');
  const maneuverability = extractValue(ship.wikitext, 'Maneuverability');
  const space = extractValue(ship.wikitext, 'Space');
  const atmosphere = extractValue(ship.wikitext, 'Atmosphere');
  const hull = extractValue(ship.wikitext, 'Hull');
  const shields = extractValue(ship.wikitext, 'Shields');

  const sensors = extractSensors(ship.wikitext);
  const weapons = extractWeapons(ship.wikitext);
  const description = extractDescription(ship.wikitext);
  const imageFilename = extractImageFilename(ship.wikitext);

  return {
    name,
    craft,
    affiliation,
    type,
    category: category.type,
    scale,
    length,
    skill,
    crew,
    crewSkill,
    passengers,
    cargoCapacity,
    consumables,
    cost,
    hyperdrive,
    navComputer,
    maneuverability,
    space,
    atmosphere,
    hull,
    shields,
    sensors,
    weapons,
    description,
    imageFilename,
    imageUrl: '',
    notes: `Source text CC-BY-SA 3.0 from http://d6holocron.com/wiki/${encodeURIComponent(ship.title)}`,
    sources: [`http://d6holocron.com/wiki/${encodeURIComponent(ship.title)}`],
    pageId: ship.pageId,
    revisionId: ship.revId,
  };
};

const safeFilename = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const writeJson = (filepath, data) => {
  writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
};

const main = async () => {
  const categoryConfig = CATEGORY_MAP[CATEGORY];
  console.log(`Fetching ${categoryConfig.page} (limit ${LIMIT})...`);

  const titles = await fetchCategoryLinks(categoryConfig.page);
  console.log(`Found ${titles.length} starships. Harvesting first ${LIMIT}.`);

  const structured = [];

  for (const [index, title] of titles.entries()) {
    if (structured.length >= LIMIT) break;

    try {
      console.log(`Fetching ${title} (${structured.length + 1}/${LIMIT})...`);
      const ship = await fetchStarshipPage(title);
      const rawPath = path.join(RAW_DIR, `${safeFilename(title)}.json`);

      writeJson(rawPath, {
        title: ship.title,
        pageId: ship.pageId,
        revisionId: ship.revId,
        wikitext: ship.wikitext,
        category: categoryConfig.type,
        license: 'CC-BY-SA 3.0',
        sourceUrl: `http://d6holocron.com/wiki/${encodeURIComponent(ship.title)}`,
        retrievedAt: new Date().toISOString(),
      });

      structured.push(parseStarship(ship, categoryConfig));
      await sleep(REQUEST_DELAY);
    } catch (error) {
      console.error(`Failed to fetch "${title}": ${error.message}`);
    }
  }

  const outputPath = path.join(OUTPUT_ROOT, `${CATEGORY}-import-ready.json`);
  writeJson(outputPath, {
    dryRun: false,
    starships: structured,
    metadata: {
      category: CATEGORY,
      retrievedAt: new Date().toISOString(),
      count: structured.length,
      license: 'CC-BY-SA 3.0',
      source: `http://d6holocron.com/wiki/${categoryConfig.page}`,
    },
  });

  console.log(`\nStored ${structured.length} starships in ${outputPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
