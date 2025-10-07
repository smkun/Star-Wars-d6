#!/usr/bin/env node
'use strict';

/**
 * Pulls race data from the d6holocron MediaWiki API and stores both raw
 * wikitext (for attribution/inspection) and lightly structured fields that map
 * onto our species schema. All retrieved text remains CC-BY-SA 3.0 per the wiki.
 */

const fs = require('fs');
const { writeFileSync, existsSync, mkdirSync } = fs;
const path = require('path');

const API_URL = 'http://d6holocron.com/wiki/api.php';
const OUTPUT_ROOT = path.resolve(__dirname, '..', 'Source Data', 'd6holocron');
const RAW_DIR = path.join(OUTPUT_ROOT, 'raw');
const INDEX_PATH = path.join(OUTPUT_ROOT, 'races-index.json');
const STRUCTURED_PATH = path.join(OUTPUT_ROOT, 'structured-preview.json');
const IMPORT_PATH = path.join(OUTPUT_ROOT, 'import-ready.json');

const ATTRIBUTE_KEYS = {
  DEXTERITY: 'dexterity',
  KNOWLEDGE: 'knowledge',
  MECHANICAL: 'mechanical',
  PERCEPTION: 'perception',
  STRENGTH: 'strength',
  TECHNICAL: 'technical',
};

const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const delayArg = args.find((arg) => arg.startsWith('--delay='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : 5;
const REQUEST_DELAY = delayArg ? Number(delayArg.split('=')[1]) : 400;

if (!existsSync(OUTPUT_ROOT)) {
  mkdirSync(OUTPUT_ROOT, { recursive: true });
}

if (!existsSync(RAW_DIR)) {
  mkdirSync(RAW_DIR, { recursive: true });
}

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
      'User-Agent':
        'Star-Wars-d6-Species-Catalog/1.0 (+https://d6holocron.com; CC-BY-SA compliance script)',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Request failed (${response.status} ${response.statusText}): ${body}`,
    );
  }

  return response.json();
};

const fetchRaceLinks = async () => {
  const data = await fetchJson({
    action: 'parse',
    page: 'Races',
    prop: 'links',
    format: 'json',
  });

  if (!data.parse || !Array.isArray(data.parse.links)) {
    throw new Error('Unexpected response while fetching race links');
  }

  return data.parse.links
    .filter((link) => link.ns === 0 && link['*'])
    .map((link) => link['*']);
};

const fetchRacePage = async (title) => {
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
    throw new Error(`Page "${title}" not found in MediaWiki response`);
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
    .replace(
      /\[\[([^|\]]+)\|([^|\]]+)\]\]/g,
      (_, _target, display) => display,
    )
    .replace(/\[\[([^\]]+)\]\]/g, (_, display) => display)
    .replace(/''+/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/{{[^}]+}}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractValue = (wikitext, label) => {
  const pattern = new RegExp(`'''${label}:'''\\s*([^\\n]+)`, 'i');
  const match = wikitext.match(pattern);
  if (!match) {
    return null;
  }
  const rawValue = match[1].split(/<br\s*\/?>/i)[0];
  return stripWikiMarkup(rawValue);
};

const extractAttributes = (wikitext) => {
  const attributes = {};
  const regex =
    /(DEXTERITY|KNOWLEDGE|MECHANICAL|PERCEPTION|STRENGTH|TECHNICAL)\s+([0-9Dd\+\-]+(?:\s*\/\s*[0-9Dd\+\-]+)?)/g;

  let match = regex.exec(wikitext);
  while (match) {
    const key = ATTRIBUTE_KEYS[match[1].toUpperCase()];
    if (key) {
      const [minRaw, maxRaw] = match[2]
        .toUpperCase()
        .split('/')
        .map((value) => value.trim());
      attributes[key] = {
        min: minRaw || '',
        max: maxRaw || '',
      };
    }
    match = regex.exec(wikitext);
  }

  return Object.keys(attributes).length ? attributes : null;
};

const extractSection = (wikitext, targetHeading) => {
  const lines = wikitext.split(/\r?\n/);
  const normalizedTarget = targetHeading.toLowerCase();
  let capturing = false;
  const buffer = [];

  for (const line of lines) {
    const headingMatch = line.match(/^=+\s*(.+?)\s*=+\s*$/);
    if (headingMatch) {
      const headingText = headingMatch[1]
        .replace(/'/g, '')
        .replace(/:/g, '')
        .trim()
        .toLowerCase();

      if (capturing && headingText !== normalizedTarget) {
        break;
      }

      if (!capturing && headingText === normalizedTarget) {
        capturing = true;
        continue;
      }
    }

    if (capturing) {
      buffer.push(line);
    }
  }

  const content = buffer.join('\n').trim();
  return content.length ? content : null;
};

const parseBulletEntries = (sectionText) => {
  if (!sectionText) {
    return [];
  }

  return sectionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/['"]?([^:'"]+?)['"]?\s*:\s*(.+)/);
      if (match) {
        return {
          name: stripWikiMarkup(match[1]),
          description: stripWikiMarkup(match[2]),
        };
      }
      return {
        name: '',
        description: stripWikiMarkup(line),
      };
    })
    .filter((entry) => entry.description);
};

const sanitizeSection = (sectionText) => {
  if (!sectionText) {
    return null;
  }

  const parts = sectionText
    .split(/\r?\n/)
    .map((line) => stripWikiMarkup(line))
    .filter(Boolean);

  return parts.length ? parts.join(' ') : null;
};

const safeFilename = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const extractIntro = (wikitext) => {
  const lines = wikitext.split(/\r?\n/);
  const buffer = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (/^=+/.test(trimmed)) {
      break;
    }
    if (/^\[\[File:/i.test(trimmed)) {
      continue;
    }
    if (/^'''(Species|Home Planet|Attribute Dice|Source)/i.test(trimmed)) {
      continue;
    }
    buffer.push(stripWikiMarkup(trimmed));
  }
  return buffer.join(' ').replace(/\s+/g, ' ').trim();
};

const parseNamesSection = (sectionText) => {
  if (!sectionText) {
    return [];
  }

  const cleaned = sectionText
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/[,;]/g, '\n');

  return Array.from(
    new Set(
      cleaned
        .split(/\r?\n|\*/g)
        .map((entry) => stripWikiMarkup(entry).trim())
        .filter(Boolean),
    ),
  );
};

const derivePlural = (name) => {
  if (!name) {
    return '';
  }
  if (name.endsWith('s') || /['-]/.test(name)) {
    return name;
  }
  if (name.endsWith('y')) {
    return `${name.slice(0, -1)}ies`;
  }
  return `${name}s`;
};

const inferNativeLanguage = (languageNotes, speciesName) => {
  if (!languageNotes) {
    return `${speciesName} language`;
  }

  const nameMatch = languageNotes.match(
    /speak(?:s)?(?: their)?(?: own)?(?: native)? ([A-Za-z' -]+)(?: language)?/i,
  );
  if (nameMatch) {
    const raw = stripWikiMarkup(nameMatch[1]).trim();
    const candidate = raw
      .split(/\bor\b/i)
      .map((part) => part.replace(/language/i, '').trim())
      .filter(Boolean)
      .pop();
    if (candidate) {
      return candidate;
    }
    return raw;
  }

  const altMatch = languageNotes.match(/\"([A-Za-z' -]+)\"/);
  if (altMatch) {
    return stripWikiMarkup(altMatch[1]).trim();
  }

  return `${speciesName} language`;
};

const createImportRecord = (race) => {
  if (
    !race.attributeDice ||
    !race.attributes ||
    !race.move ||
    !race.size
  ) {
    return null;
  }

  const description =
    race.introText ||
    `See source entry ${race.sourceUrl} for background (CC-BY-SA 3.0).`;
  const cleanedDescription = description
    .replace(/Attribute Dice:.*/i, '')
    .replace(/Special Abilities:.*/i, '')
    .replace(/Story Factors:.*/i, '')
    .trim();
  const personality = race.personality || '';
  const physical =
    race.physicalDescription ||
    race.biological ||
    'See source for physical description.';

  const languageDescription =
    race.languageNotes ||
    `Language details were not provided; refer to ${race.sourceUrl}.`;
  const languages = {
    native: inferNativeLanguage(race.languageNotes, race.name),
    description: languageDescription,
  };

  const exampleNames = race.names && race.names.length
    ? race.names
        .filter((entry) => !/names are/i.test(entry))
        .slice(0, 6)
    : [];

  const adventurers =
    race.adventurers ||
    race.galaxyNotes ||
    '';

  return {
    name: race.name,
    plural: derivePlural(race.name),
    description: cleanedDescription || description,
    personality,
    physicalDescription: physical,
    homeworld: race.homeworld || '',
    languages,
    exampleNames,
    adventurers,
    imageUrl: '',
    stats: {
      attributeDice: race.attributeDice,
      attributes: race.attributes,
      move: race.move,
      size: race.size,
    },
    specialAbilities: race.specialAbilities,
    storyFactors: race.storyFactors,
    notes: `Source text CC-BY-SA 3.0 from ${race.sourceUrl}`,
    sources: [
      race.source && race.source.trim()
        ? race.source.trim()
        : `CC-BY-SA 3.0 d6holocron.com/wiki/${encodeURIComponent(
            race.name,
          )}`,
    ],
  };
};

const parseRace = (race) => {
  const homeworld = extractValue(race.wikitext, 'Home Planet');
  const attributeDice = extractValue(race.wikitext, 'Attribute Dice');
  const move = extractValue(race.wikitext, 'Move');
  const size = extractValue(race.wikitext, 'Size');
  const source = extractValue(race.wikitext, 'Source');
  const attributes = extractAttributes(race.wikitext);
  const abilitiesSection = extractSection(race.wikitext, 'Special Abilities');
  const storyFactorsSection = extractSection(race.wikitext, 'Story Factors');
  const introText = sanitizeSection(extractIntro(race.wikitext));
  const personality = sanitizeSection(
    extractSection(race.wikitext, 'Personality'),
  );
  const biological = sanitizeSection(
    extractSection(race.wikitext, 'Biology & Appearance'),
  );
  const physicalDescription = sanitizeSection(
    extractSection(race.wikitext, 'Physical Description'),
  );
  const adventurers = sanitizeSection(
    extractSection(race.wikitext, `${race.title} in the Galaxy`),
  );
  const namesSection = sanitizeSection(
    extractSection(race.wikitext, 'Names'),
  );

  const specialAbilities = parseBulletEntries(abilitiesSection);
  const storyFactors = parseBulletEntries(storyFactorsSection).filter(
    (entry) => {
      const label = entry.name.toLowerCase();
      return label && !['size', 'move', 'source'].includes(label);
    },
  );

  return {
    name: race.title,
    pageId: race.pageId,
    revisionId: race.revId,
    homeworld: homeworld || null,
    attributeDice: attributeDice || null,
    attributes: attributes || null,
    move: move || null,
    size: size || null,
    source: source || null,
    specialAbilities,
    storyFactors,
    introText,
    personality,
    biological,
    physicalDescription,
    adventurers,
    names: parseNamesSection(namesSection),
    languageNotes: sanitizeSection(extractSection(race.wikitext, 'Language')),
    namesNotes: sanitizeSection(extractSection(race.wikitext, 'Names')),
    license: 'CC-BY-SA 3.0',
    sourceUrl: `http://d6holocron.com/wiki/${encodeURIComponent(race.title)}`,
  };
};

const writeJson = (filepath, data) => {
  writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
};

const main = async () => {
  console.log(`Fetching race index (limit ${LIMIT})...`);
  const titles = await fetchRaceLinks();

  writeJson(INDEX_PATH, {
    retrievedAt: new Date().toISOString(),
    total: titles.length,
    titles,
    license: 'CC-BY-SA 3.0',
    source: 'http://d6holocron.com/wiki/Races',
  });

  console.log(`Found ${titles.length} race links. Harvesting first ${LIMIT}.`);

  const structured = [];

  for (const [index, title] of titles.entries()) {
    if (structured.length >= LIMIT) {
      break;
    }

    try {
      console.log(`Fetching ${title} (${structured.length + 1}/${LIMIT})...`);
      const race = await fetchRacePage(title);
      const rawPath = path.join(RAW_DIR, `${safeFilename(title)}.json`);

      writeJson(rawPath, {
        title: race.title,
        pageId: race.pageId,
        revisionId: race.revId,
        wikitext: race.wikitext,
        license: 'CC-BY-SA 3.0',
        sourceUrl: `http://d6holocron.com/wiki/${encodeURIComponent(race.title)}`,
        retrievedAt: new Date().toISOString(),
      });

      structured.push(parseRace(race));
      await sleep(REQUEST_DELAY);
    } catch (error) {
      console.error(`Failed to fetch "${title}": ${error.message}`);
    }
  }

  const importCandidates = structured
    .map(createImportRecord)
    .filter(Boolean);

  writeJson(STRUCTURED_PATH, {
    retrievedAt: new Date().toISOString(),
    limit: LIMIT,
    count: structured.length,
    races: structured,
  });

  const retrievedAt = new Date().toISOString();

  writeJson(IMPORT_PATH, {
    dryRun: false,
    species: importCandidates,
    metadata: {
      retrievedAt,
      count: importCandidates.length,
      license: 'CC-BY-SA 3.0',
      source: 'http://d6holocron.com/wiki/Races',
    },
  });

  console.log(
    `Stored ${structured.length} structured records in ${STRUCTURED_PATH}`,
  );
  console.log(
    `Created ${importCandidates.length} import-ready records in ${IMPORT_PATH}`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
