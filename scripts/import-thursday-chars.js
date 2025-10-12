#!/usr/bin/env node
/**
 * Import 6 new characters from Thursday.txt to MySQL
 * Uses same connection pattern as update-mysql-from-aliens-json.js
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const MYSQL_URL = process.env.MYSQL_URL;
const SCOTT_UID = 'oWfK2bwb7FbveHTk5rHM2uqLPgF2';

if (!MYSQL_URL) {
  console.error('MYSQL_URL environment variable is required');
  console.error('Example: MYSQL_URL="mysql://user:pass@host:port/db" node scripts/import-thursday-chars.js');
  process.exit(1);
}

const characters = [
  {
    name: 'F1X 3R',
    species_slug: null,
    description: 'FX Series Medic/Assassin Droid',
    properties: {
      type: 'Droid',
      forceSensitive: false,
      move: 8,
      characterPoints: 5,
      forcePoints: 1,
      credits: 500,
      attributes: { dexterity: '2D+2', knowledge: '3D+2', mechanical: '2D', perception: '3D', strength: '2D+2', technical: '4D+1' },
      skills: { blaster: '3D+2', firstAid: '6D+1', battlefieldTrauma: '7D+1', security: '6D+1', electronicLocks: '7D+1', droidRepair: '5D+1', fieldService: '6D+1', computerProgrammingRepair: '5D+1' },
      weapons: ['Hold Out Blaster (3D; 3–7/15/30; 6; +1D conceal in civvies)'],
      armor: 'Chassis only',
      gear: ['Medkit (+1D First Aid w/ time)', 'Medscanner (+1D diagnosis)', 'Restraining bolt & interface', 'Internal comlink', 'Encrypted dataport', '4 medpacs', '1 bacta']
    }
  },
  {
    name: 'Ragath',
    species_slug: 'barabel',
    description: 'Barabel Mercenary',
    properties: {
      forceSensitive: false,
      move: 10,
      characterPoints: 5,
      forcePoints: 1,
      credits: 900,
      attributes: { dexterity: '3D', knowledge: '2D', mechanical: '2D', perception: '2D+2', strength: '4D+1', technical: '3D' },
      skills: { blaster: '5D', blasterCarbine: '6D', melee: '4D', vibroAx: '5D', dodge: '4D', intimidation: '3D+2', brawling: '6D+1', grapple: '7D+1' },
      weapons: ['EE 3 Carbine (5D)', 'Vibro Ax (STR+3D, max 7D, 2 handed)'],
      armor: 'Blast Vest (+1D Phys, +1 Eng)',
      gear: ['Breath mask', 'Macrobinoculars', 'Field kit', 'Comlink']
    }
  },
  {
    name: 'Tekli',
    species_slug: 'chadra-fan',
    description: 'Chadra Fan Pilot/Mechanic',
    properties: {
      forceSensitive: false,
      move: 8,
      characterPoints: 5,
      forcePoints: 1,
      credits: 1000,
      attributes: { dexterity: '3D', knowledge: '2D+1', mechanical: '3D+1', perception: '3D+1', strength: '2D', technical: '4D' },
      skills: { spaceTransports: '5D+1', yt1300: '6D+1', starshipGunnery: '4D+1', laserCannonsFreighters: '5D+1', repulsorliftOperation: '4D+1', starshipRepair: '6D', hyperdrives: '7D', droidRepair: '5D' },
      weapons: ['Hold Out Blaster (3D)'],
      armor: 'Flight Suit (enviro only)',
      gear: ['Tool kit', 'Diagnostic scanner (+1D to appropriate Repair with time)', 'Datapad', 'Comlink']
    }
  },
  {
    name: "Kaa'Reth",
    species_slug: 'verpine',
    description: 'Verpine Operative',
    properties: {
      forceSensitive: false,
      move: 10,
      characterPoints: 5,
      forcePoints: 1,
      credits: 1200,
      attributes: { dexterity: '3D', knowledge: '2D+2', mechanical: '3D', perception: '3D', strength: '2D+2', technical: '4D+1' },
      skills: { hide: '4D', urbanCamouflage: '5D', sneak: '4D', security: '6D+1', electronicSystems: '7D+1', computerProgrammingRepair: '6D+1', slicingIntrusion: '7D+1', starshipRepair: '5D+1' },
      weapons: ['Sporting Blaster (3D+2; 3–12/30/120; 50; scoped)', 'HOUSE RULE (Suppressor): +10 to hearing based checks to pinpoint; shooter gains +1D Sneak/Hide immediately after firing if situation allows'],
      armor: 'Camo Poncho (no soak; +1D Hide/Sneak when stationary/matching terrain)',
      gear: ['Security kit (+1D with time)', 'Slicer suite (+1D intrusion)', 'Forged IDs', 'Datapad', 'Comlink']
    }
  },
  {
    name: 'Cheedo',
    species_slug: 'rodian',
    description: 'Rodian Scoundrel',
    properties: {
      forceSensitive: false,
      move: 10,
      characterPoints: 5,
      forcePoints: 1,
      credits: 1300,
      attributes: { dexterity: '3D+1', knowledge: '2D+1', mechanical: '3D', perception: '3D+1', strength: '2D+2', technical: '3D' },
      skills: { blaster: '5D+1', blasterPistols: '6D+1', dodge: '4D+1', streetwise: '3D+1', blackMarkets: '4D+1', con: '5D+1', fastTalk: '6D+1', security: '4D' },
      weapons: ['DL 18 Pistol (4D)', 'Vibroshiv (STR+1D, max 5D; +1D conceal in light clothing)'],
      armor: 'Armored Jacket (+1D Phys, +1 Eng)',
      gear: ['Holo Disguise Scarf (+1D to Con, House Rule opposed at Short)', 'Lockpick set (+1D mechanical locks)', 'Datapad', 'Comlink']
    }
  },
  {
    name: 'Dakk',
    species_slug: null,
    description: 'Human Ace Pilot',
    properties: {
      forceSensitive: false,
      move: 10,
      characterPoints: 5,
      forcePoints: 1,
      credits: 800,
      attributes: { dexterity: '3D', knowledge: '2D+2', mechanical: '4D', perception: '3D', strength: '2D+2', technical: '3D' },
      skills: { dodge: '4D', starfighterPiloting: '6D', yWing: '7D', starshipGunnery: '6D', laserCannonsStarfighter: '7D', astrogation: '5D', rimLanes: '6D', spaceTransports: '5D' },
      weapons: ['Blaster Pistol (4D)'],
      armor: 'Flight Suit & Helmet (enviro only)',
      gear: ['Tool kit', 'Vac tape', 'Datapad w/ navcharts', 'Comlink']
    }
  }
];

async function main() {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection(MYSQL_URL);
  console.log('✅ Connected\n');

  let inserted = 0;
  let errors = 0;

  for (const char of characters) {
    const id = uuidv4();
    try {
      await conn.query(
        'INSERT INTO characters (id, user_id, name, species_slug, description, properties, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [id, SCOTT_UID, char.name, char.species_slug, char.description, JSON.stringify(char.properties)]
      );
      console.log(`✅ ${char.name} (${id})`);
      inserted++;
    } catch (err) {
      console.error(`❌ ${char.name} - error:`, err.message);
      errors++;
    }
  }

  await conn.end();

  console.log('\n=== Import Summary ===');
  console.log(`Inserted: ${inserted}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
