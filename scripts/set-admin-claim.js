#!/usr/bin/env node

/**
 * Set admin custom claim for Firebase user
 *
 * Usage: node scripts/set-admin-claim.js <email>
 * Example: node scripts/set-admin-claim.js admin@example.com
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Error: User email required');
  console.log('Usage: node scripts/set-admin-claim.js <email>');
  process.exit(1);
}

async function setAdminClaim() {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(userEmail);

    // Set custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    console.log(`✅ Admin claim set for ${userEmail}`);
    console.log(`   UID: ${user.uid}`);
    console.log('');
    console.log('⚠️  User must sign out and sign in again for claim to take effect');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.code === 'auth/user-not-found') {
      console.log('');
      console.log('💡 User not found. Create user first:');
      console.log('   1. Go to Firebase Console → Authentication');
      console.log('   2. Add user manually OR');
      console.log('   3. Have user sign up through the app');
    }

    process.exit(1);
  }
}

setAdminClaim();
