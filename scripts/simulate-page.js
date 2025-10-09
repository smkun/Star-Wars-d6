const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = 'AIzaSyAvN3w0J2lNXsnc8WjaPjvsljOyb-UCLww';

async function simulate() {
  // Fetch starfighters like the page does
  let allDocs = [];
  let pageToken = null;
  
  do {
    let url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT + '/databases/(default)/documents/starships?pageSize=300';
    if (pageToken) url += '&pageToken=' + pageToken;
    url += '&key=' + API_KEY;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.documents) allDocs = allDocs.concat(data.documents);
    pageToken = data.nextPageToken;
  } while (pageToken);

  // Filter to starfighters only
  const starfighters = allDocs.filter(doc => {
    return doc.fields.category?.stringValue === 'starfighter';
  }).map(doc => ({
    id: doc.name.split('/').pop(),
    name: doc.fields.name?.stringValue,
    isVariant: doc.fields.isVariant?.booleanValue,
    parent: doc.fields.parent?.stringValue,
  }));

  console.log('Total starfighters:', starfighters.length);

  // Simulate the grouping logic from Starfighters.tsx
  const grouped = new Map();
  const variantFamilies = new Map();

  starfighters.forEach((ship) => {
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

  console.log('\nStandalone ships:', grouped.size);
  console.log('Variant families:', variantFamilies.size);

  // Apply the fix logic
  variantFamilies.forEach((variants, parentKey) => {
    if (variants.length > 0) {
      const realBaseShip = Array.from(grouped.values()).find(
        (ship) => ship.name === parentKey && !ship.isVariant
      );

      if (realBaseShip) {
        console.log('Found real base for "' + parentKey + '" - keeping original');
      } else {
        console.log('Creating synthetic entry for "' + parentKey + '" (' + variants.length + ' variants)');
        const familyEntry = {
          ...variants[0],
          id: 'family-' + parentKey.toLowerCase().replace(/\s+/g, '-'),
          name: parentKey,
          isVariant: false,
          parent: undefined,
        };
        grouped.set(familyEntry.id, familyEntry);
      }
    }
  });

  console.log('\nFinal ship count:', grouped.size);
  
  // Check for TIE Fighter
  const tieEntry = Array.from(grouped.values()).find(s => 
    s.name === 'TIE Fighter' || (s.name && s.name.toUpperCase().includes('TIE FIGHTER'))
  );
  
  if (tieEntry) {
    console.log('\nTIE Fighter found in list!');
    console.log('  ID:', tieEntry.id);
    console.log('  Name:', tieEntry.name);
    console.log('  isVariant:', tieEntry.isVariant);
  } else {
    console.log('\nTIE Fighter NOT in final list!');
  }

  // Show first 25 final ships
  const finalShips = Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
  console.log('\nFirst 25 ships:');
  finalShips.slice(0, 25).forEach((s, i) => console.log((i + 1) + '. ' + s.name));
}

simulate();
