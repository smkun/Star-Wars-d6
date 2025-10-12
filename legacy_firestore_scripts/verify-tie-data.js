/* ARCHIVED COPY: verify-tie-data.js */
const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';
async function verifyTIE() {
  let allDocs = [];
  let pageToken = null;
  do {
    let url =
      'https://firestore.googleapis.com/v1/projects/' +
      FIREBASE_PROJECT +
      '/databases/(default)/documents/starships?pageSize=300';
    if (pageToken) url += '&pageToken=' + pageToken;
    url += '&key=' + API_KEY;
    const response = await fetch(url);
    const data = await response.json();
    if (data.documents) allDocs = allDocs.concat(data.documents);
    pageToken = data.nextPageToken;
  } while (pageToken);
  const tieShips = allDocs.filter((doc) => {
    const name = doc.fields.name?.stringValue || '';
    return name.toUpperCase().includes('TIE');
  });
  console.log('=== TIE Fighter Data Verification ===\n');
  console.log('Total TIE ships: ' + tieShips.length);
  const baseTIE = tieShips.find((doc) => {
    const name = doc.fields.name?.stringValue;
    const isVariant = doc.fields.isVariant?.booleanValue;
    const parent = doc.fields.parent?.stringValue;
    return name === 'TIE Fighter' && !isVariant && !parent;
  });
  if (baseTIE) {
    console.log('\nBase TIE Fighter: FOUND');
    console.log('  ID:', baseTIE.name.split('/').pop());
    console.log('  Name:', baseTIE.fields.name?.stringValue);
    console.log('  Category:', baseTIE.fields.category?.stringValue);
  } else {
    console.log('\nBase TIE Fighter: NOT FOUND!!!');
  }
  const variants = tieShips.filter((doc) => {
    const isVariant = doc.fields.isVariant?.booleanValue;
    const parent = doc.fields.parent?.stringValue;
    return isVariant && parent === 'TIE Fighter';
  });
  console.log('\nTIE Fighter variants: ' + variants.length);
  console.log('First 5 variants:');
  variants.slice(0, 5).forEach((doc) => {
    console.log(
      '  - ' +
        doc.fields.name?.stringValue +
        ' (category: ' +
        doc.fields.category?.stringValue +
        ')'
    );
  });
}
verifyTIE();
