// Simulate the Starfighters.tsx filtering logic

const starships = [
  { id: 'tie-fighter', name: 'TIE Fighter', isVariant: false, parent: undefined, category: 'starfighter' },
  { id: 'tie-interceptor', name: 'TIE Interceptor', isVariant: true, parent: 'TIE Fighter', category: 'starfighter' },
  { id: 'tie-bomber', name: 'TIE/sa Bomber', isVariant: true, parent: 'TIE Fighter', category: 'starfighter' },
  { id: 'x-wing', name: 'X-Wing Starfighters', isVariant: false, parent: undefined, category: 'starfighter' },
];

// Group variants
const grouped = new Map();
const variantFamilies = new Map();

starships.forEach((ship) => {
  if (ship.isVariant && ship.parent) {
    const parentKey = ship.parent;
    if (!variantFamilies.has(parentKey)) {
      variantFamilies.set(parentKey, []);
    }
    variantFamilies.get(parentKey).push(ship);
  } else {
    grouped.set(ship.id, ship);
  }
});

console.log('After first pass:');
console.log('Grouped (standalone ships):', Array.from(grouped.keys()));
console.log('Variant families:', Array.from(variantFamilies.keys()));

// Second pass with fix
variantFamilies.forEach((variants, parentKey) => {
  if (variants.length > 0) {
    const realBaseShip = Array.from(grouped.values()).find(
      (ship) => ship.name === parentKey && !ship.isVariant
    );

    if (realBaseShip) {
      console.log(`\nFound real base ship for "${parentKey}" - keeping it`);
      return;
    }

    console.log(`\nNo real base ship for "${parentKey}" - creating synthetic entry`);
    const familyEntry = {
      ...variants[0],
      id: `family-${parentKey.toLowerCase().replace(/\s+/g, '-')}`,
      name: parentKey,
      isVariant: false,
      parent: undefined,
    };
    grouped.set(familyEntry.id, familyEntry);
  }
});

console.log('\nFinal grouped ships:');
Array.from(grouped.values()).forEach(ship => {
  console.log(`  - ${ship.name} (${ship.id})`);
});
