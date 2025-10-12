// ARCHIVED COPY: seed-emulator.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const net = require('net');
function parseHostPort(env) {
  if (!env) return null;
  const [host, port] = env.split(':');
  return { host, port: parseInt(port || '0', 10) };
}
function waitForHost(host, port, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      socket.destroy();
      reject(new Error('timeout'));
    }, timeoutMs);
    socket.once('error', (err) => {
      clearTimeout(timer);
      if (!timedOut) reject(err);
    });
    socket.connect(port, host, () => {
      clearTimeout(timer);
      socket.end();
      resolve();
    });
  });
}
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error('operation timeout')), ms)
    ),
  ]);
}
async function main() {
  const samplePath = path.join(__dirname, '..', 'dev', 'sample_species.json');
  const data = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('Detected FIRESTORE_EMULATOR_HOST, checking connectivity...');
    const parsed = parseHostPort(process.env.FIRESTORE_EMULATOR_HOST);
    try {
      if (parsed && parsed.host && parsed.port) {
        await waitForHost(parsed.host, parsed.port, 3000);
        console.log(
          'Emulator appears to be listening at',
          process.env.FIRESTORE_EMULATOR_HOST
        );
      } else {
        console.log(
          'FIRESTORE_EMULATOR_HOST set but could not parse host:port, proceeding'
        );
      }
    } catch (err) {
      console.error(
        'Could not connect to Firestore emulator at',
        process.env.FIRESTORE_EMULATOR_HOST,
        '-',
        err.message
      );
      process.exit(1);
    }
    process.env.FIREBASE_AUTH_EMULATOR_HOST =
      process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST =
      process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT || 'demo-project',
    });
  } else {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyPath) {
      console.error(
        'GOOGLE_APPLICATION_CREDENTIALS not set and not using emulator. Aborting.'
      );
      process.exit(1);
    }
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  const db = admin.firestore();
  for (const doc of data) {
    const ref = db.collection('species').doc(doc.slug);
    console.log('Seeding', doc.slug);
    try {
      await withTimeout(
        ref.set({
          ...doc,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
        5000
      );
    } catch (err) {
      console.error('Failed to write', doc.slug, ':', err.message);
    }
  }
  console.log('Seeding complete');
  try {
    await admin.app().delete();
  } catch (err) {}
  process.exit(0);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
