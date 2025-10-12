/**
 * Fix Thursday characters data format to match the form-created format
 * Converts flat attributes/skills structure to nested attribute objects
 */

const mysql = require('mysql2/promise');

const MYSQL_URL = process.env.MYSQL_URL || 'mysql://gamers_sa:KAd5Og-nJbDc%25%3FC%26@31.22.4.44:3306/gamers_d6Holochron';

// Thursday character IDs that need fixing
const THURSDAY_IDS = [
  'f1x-3r-001',    // F1X 3R
  'ragath-001',    // Ragath
  'tekli-001',     // Tekli
  'kaareth-001',   // Kaa'Reth
  'cheedo-001',    // Cheedo
  'dakk-001',      // Dakk
];

// Map skill names to their parent attributes
function getAttributeForSkill(skillName) {
  const lower = skillName.toLowerCase();

  // Dexterity skills
  if (lower.match(/blaster|dodge|brawl|melee|grapple|thrown|lightsaber|parr/i)) {
    return 'dexterity';
  }

  // Mechanical skills
  if (lower.match(/pilot|gunnery|astro|transport|repulsor|starship|starfighter|walker|beast.?riding/i)) {
    return 'mechanical';
  }

  // Perception skills
  if (lower.match(/search|hide|sneak|tracking|investigation|bargain|command|con|persuasion|gambling|forgery/i)) {
    return 'perception';
  }

  // Knowledge skills
  if (lower.match(/alien|bureaucracy|cultures|intimidation|languages|law|planetary|scholar|streetwise|survival|tactics|willpower/i)) {
    return 'knowledge';
  }

  // Strength skills
  if (lower.match(/climb|lift|stamina|swim/i)) {
    return 'strength';
  }

  // Technical skills
  if (lower.match(/repair|computer|demolition|droid|first.?aid|medicine|security|slicing|programming/i)) {
    return 'technical';
  }

  // Default to technical for ambiguous cases
  return 'technical';
}

async function fixCharacters() {
  const conn = await mysql.createConnection(MYSQL_URL);

  try {
    console.log('Fetching Thursday characters...\n');

    const [rows] = await conn.query(
      'SELECT id, name, data FROM characters WHERE id IN (?)',
      [THURSDAY_IDS]
    );

    console.log(`Found ${rows.length} characters to fix\n`);

    for (const row of rows) {
      console.log(`Fixing: ${row.name} (${row.id})`);

      const oldData = JSON.parse(row.data);

      // Check if already in correct format
      if (oldData.dexterity && typeof oldData.dexterity === 'object' && oldData.dexterity.dice) {
        console.log(`  ✓ Already in correct format, skipping\n`);
        continue;
      }

      // Build skills grouped by attribute
      const skillsByAttribute = {
        dexterity: [],
        knowledge: [],
        mechanical: [],
        perception: [],
        strength: [],
        technical: [],
      };

      if (oldData.skills) {
        Object.entries(oldData.skills).forEach(([skillName, dice]) => {
          const attr = getAttributeForSkill(skillName);

          // Check if this is a specialization (camelCase with capital mid-word)
          const isSpecialization = skillName.match(/[a-z][A-Z]/) !== null;

          skillsByAttribute[attr].push({
            name: skillName,
            dice: dice,
            isSpecialization: isSpecialization
          });
        });
      }

      // Build new format
      const newData = {
        ...oldData,

        // Transform flat attributes to nested objects
        dexterity: {
          dice: oldData.attributes?.dexterity || '2D',
          skills: skillsByAttribute.dexterity
        },
        knowledge: {
          dice: oldData.attributes?.knowledge || '2D',
          skills: skillsByAttribute.knowledge
        },
        mechanical: {
          dice: oldData.attributes?.mechanical || '2D',
          skills: skillsByAttribute.mechanical
        },
        perception: {
          dice: oldData.attributes?.perception || '2D',
          skills: skillsByAttribute.perception
        },
        strength: {
          dice: oldData.attributes?.strength || '2D',
          skills: skillsByAttribute.strength
        },
        technical: {
          dice: oldData.attributes?.technical || '2D',
          skills: skillsByAttribute.technical
        },

        // Add empty Force attributes if missing
        control: oldData.control || { dice: '', skills: [] },
        sense: oldData.sense || { dice: '', skills: [] },
        alter: oldData.alter || { dice: '', skills: [] },

        // Rename gear to equipment
        equipment: oldData.gear || oldData.equipment || [],

        // Remove old flat structures
        attributes: undefined,
        skills: undefined,
        gear: undefined,
      };

      // Update database
      await conn.query(
        'UPDATE characters SET data = ? WHERE id = ?',
        [JSON.stringify(newData), row.id]
      );

      console.log(`  ✓ Updated successfully`);
      console.log(`    - DEX skills: ${skillsByAttribute.dexterity.length}`);
      console.log(`    - KNO skills: ${skillsByAttribute.knowledge.length}`);
      console.log(`    - MEC skills: ${skillsByAttribute.mechanical.length}`);
      console.log(`    - PER skills: ${skillsByAttribute.perception.length}`);
      console.log(`    - STR skills: ${skillsByAttribute.strength.length}`);
      console.log(`    - TEC skills: ${skillsByAttribute.technical.length}\n`);
    }

    console.log('All characters fixed!');

  } finally {
    await conn.end();
  }
}

fixCharacters().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
