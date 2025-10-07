#!/bin/bash
# Apply image URL updates to Firestore
# Requires temporarily open Firestore rules

API_KEY="AIzaSyAvN3w0J2lNXsnc8WjaPjvsljOyb-UCLww"
PROJECT_ID="star-wars-d6-species"

echo "🔓 Step 1: Temporarily opening Firestore rules..."
cp firestore.rules firestore.rules.backup
cp firestore.rules.temp firestore.rules 2>/dev/null || cat > firestore.rules <<'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /species/{slug} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read: if false;
      allow write: if false;
    }
  }
}
EOF

firebase deploy --only firestore:rules

echo ""
echo "📤 Step 2: Applying image URL updates..."
node -e "
const fs = require('fs');
const updates = JSON.parse(fs.readFileSync('image-updates.json', 'utf-8'));

async function updateDoc(update) {
  const url = \`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/species/\${update.slug}?key=${API_KEY}&updateMask.fieldPaths=imageUrl&updateMask.fieldPaths=hasImage&updateMask.fieldPaths=imagePath\`;

  const body = {
    fields: {
      imageUrl: { stringValue: update.imageUrl },
      hasImage: { booleanValue: true },
      imagePath: { stringValue: update.imagePath }
    }
  };

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return response.ok;
}

async function main() {
  let updated = 0;
  let failed = 0;

  for (const update of updates) {
    process.stdout.write(\`📸 \${update.slug}...\r\`);
    const success = await updateDoc(update);
    if (success) {
      updated++;
    } else {
      console.log(\`\n❌ Failed: \${update.slug}\`);
      failed++;
    }
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(\`\n✅ Updated \${updated} species\`);
  if (failed > 0) console.log(\`❌ Failed \${failed} species\`);
}

main();
"

echo ""
echo "🔒 Step 3: Restoring secure Firestore rules..."
mv firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules

echo ""
echo "✅ Done! Image URLs have been updated in Firestore."
