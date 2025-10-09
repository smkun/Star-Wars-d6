#!/usr/bin/env node
'use strict';

/**
 * Enhanced starship fetcher with variant extraction and image download
 * Usage: node scripts/fetch-starships-variants.js --category=starfighters --limit=10
 */

const fs = require('fs');
const { writeFileSync, existsSync, mkdirSync, createWriteStream } = fs;
const path = require('path');
const https = require('https');
const http = require('http');

const API_URL = 'http://d6holocron.com/wiki/api.php';
const OUTPUT_ROOT = path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'starships');
const RAW_DIR = path.join(OUTPUT_ROOT, 'raw');
const IMAGE_DIR = path.join(OUTPUT_ROOT, 'images');

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

[OUTPUT_ROOT, RAW_DIR, IMAGE_DIR].forEach(dir => {
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

const fetchImageUrl = async (filename) => {
  if (!filename) return null;

  try {
    const data = await fetchJson({
      action: 'query',
      titles: `File:${filename}`,
      prop: 'imageinfo',
      iiprop: 'url',
      format: 'json',
    });

    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    return page.imageinfo?.[0]?.url || null;
  } catch (error) {
    console.error(`Failed to fetch image URL for ${filename}: ${error.message}`);
    return null;
  }
};

const downloadImage = async (url, filename) => {
  if (!url || !filename) return false;

  const outputPath = path.join(IMAGE_DIR, filename);
  if (existsSync(outputPath)) {
    return true; // Already downloaded
  }

  return new Promise((resolve) => {
    // Choose http or https module based on URL
    const protocol = url.startsWith('https:') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        console.error(`Failed to download ${filename}: ${response.statusCode}`);
        resolve(false);
        return;
      }

      const file = createWriteStream(outputPath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
      file.on('error', (err) => {
        console.error(`Error writing ${filename}: ${err.message}`);
        resolve(false);
      });
    }).on('error', (err) => {
      console.error(`Error downloading ${filename}: ${err.message}`);
      resolve(false);
    });
  });
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

// Extract H1 sections (base models like =X-Wing=)
const extractH1Sections = (wikitext) => {
  const sections = [];
  const h1Pattern = /^=([^=]+)=$/gm;
  let match;

  while ((match = h1Pattern.exec(wikitext)) !== null) {
    sections.push({
      name: match[1].trim(),
      startIndex: match.index
    });
  }

  return sections;
};

// Extract H2 sections (variants like ==T-65A X-Wing==)
const extractH2Sections = (wikitext) => {
  const sections = [];
  const h2Pattern = /^==([^=]+)==$/gm;
  let match;

  while ((match = h2Pattern.exec(wikitext)) !== null) {
    const name = match[1].trim();
    const startIndex = match.index;
    const endMatch = wikitext.substring(startIndex + match[0].length).search(/^==/m);
    const endIndex = endMatch === -1 ? wikitext.length : startIndex + match[0].length + endMatch;

    sections.push({
      name,
      startIndex,
      endIndex,
      content: wikitext.substring(startIndex, endIndex)
    });
  }

  return sections;
};

const parseVariant = (variantSection, pageTitle, parentName, category) => {
  const content = variantSection.content;

  const extractedName = extractValue(content, 'Name') || variantSection.name;
  const craft = extractValue(content, 'Craft');

  // Use craft as the name for variants if available, otherwise use extracted name
  const name = craft || extractedName;
  const affiliation = extractValue(content, 'Affiliation');
  const type = extractValue(content, 'Type');
  const scale = extractValue(content, 'Scale');
  const length = extractValue(content, 'Length');
  const skill = extractValue(content, 'Skill');
  const crew = extractValue(content, 'Crew');
  const crewSkill = extractValue(content, 'Crew Skill');
  const passengers = extractValue(content, 'Passengers');
  const cargoCapacity = extractValue(content, 'Cargo Capacity');
  const consumables = extractValue(content, 'Consumables');
  const cost = extractValue(content, 'Cost');
  const hyperdrive = extractValue(content, 'Hyperdrive');
  const navComputer = extractValue(content, 'Nav Computer');
  const maneuverability = extractValue(content, 'Maneuverability');
  const space = extractValue(content, 'Space');
  const atmosphere = extractValue(content, 'Atmosphere');
  const hull = extractValue(content, 'Hull');
  const shields = extractValue(content, 'Shields');

  const sensors = extractSensors(content);
  const weapons = extractWeapons(content);
  const description = extractDescription(content);
  const imageFilename = extractImageFilename(content);

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
    parent: parentName,
    variantOf: pageTitle,
    isVariant: true,
    notes: `Source text CC-BY-SA 3.0 from http://d6holocron.com/wiki/${encodeURIComponent(pageTitle)}`,
    sources: [`http://d6holocron.com/wiki/${encodeURIComponent(pageTitle)}`],
  };
};

const parseStarshipWithVariants = (ship, category) => {
  const h1Sections = extractH1Sections(ship.wikitext);
  const h2Sections = extractH2Sections(ship.wikitext);

  // If we have multiple H2 sections, treat them as variants
  if (h2Sections.length > 1) {
    const parentName = h1Sections.length > 0 ? h1Sections[0].name : ship.title;
    console.log(`  Found ${h2Sections.length} variants of ${parentName}`);

    return h2Sections.map(variant => parseVariant(variant, ship.title, parentName, category));
  }

  // Single ship - parse normally
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

  return [{
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
    isVariant: false,
    notes: `Source text CC-BY-SA 3.0 from http://d6holocron.com/wiki/${encodeURIComponent(ship.title)}`,
    sources: [`http://d6holocron.com/wiki/${encodeURIComponent(ship.title)}`],
    pageId: ship.pageId,
    revisionId: ship.revId,
  }];
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
  console.log(`Fetching ${categoryConfig.page} with variant extraction (limit ${LIMIT})...`);

  const titles = await fetchCategoryLinks(categoryConfig.page);
  console.log(`Found ${titles.length} pages. Processing first ${LIMIT}.`);

  const allShips = [];
  let pagesProcessed = 0;

  for (const title of titles) {
    if (pagesProcessed >= LIMIT) break;

    try {
      console.log(`\nFetching ${title} (${pagesProcessed + 1}/${LIMIT})...`);
      const ship = await fetchStarshipPage(title);

      // Save raw wikitext
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

      // Parse variants
      const variants = parseStarshipWithVariants(ship, categoryConfig);

      // Download images for each variant
      for (const variant of variants) {
        if (variant.imageFilename) {
          console.log(`  Fetching image: ${variant.imageFilename}`);
          const imageUrl = await fetchImageUrl(variant.imageFilename);

          if (imageUrl) {
            variant.imageUrl = imageUrl;
            const downloaded = await downloadImage(imageUrl, variant.imageFilename);
            if (downloaded) {
              console.log(`    Downloaded: ${variant.imageFilename}`);
            }
          }
          await sleep(REQUEST_DELAY);
        }
      }

      allShips.push(...variants);
      pagesProcessed++;

      await sleep(REQUEST_DELAY);
    } catch (error) {
      console.error(`Failed to fetch "${title}": ${error.message}`);
    }
  }

  const outputPath = path.join(OUTPUT_ROOT, `${CATEGORY}-variants-import-ready.json`);
  writeJson(outputPath, {
    dryRun: false,
    starships: allShips,
    metadata: {
      category: CATEGORY,
      retrievedAt: new Date().toISOString(),
      count: allShips.length,
      pagesProcessed,
      license: 'CC-BY-SA 3.0',
      source: `http://d6holocron.com/wiki/${categoryConfig.page}`,
    },
  });

  console.log(`\n✅ Stored ${allShips.length} starships (from ${pagesProcessed} pages) in ${outputPath}`);
  console.log(`   Images saved to: ${IMAGE_DIR}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
