/**
 * Firebase client SDK initialization
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration (reads API key from env at build time)
const firebaseConfig = {
  // Vite exposes variables prefixed with VITE_ via import.meta.env.
  // Keep other fields static (non-secret) but ensure the API key is read
  // from environment to avoid committing it into the repo.
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: 'star-wars-d6-species.firebaseapp.com',
  projectId: 'star-wars-d6-species',
  storageBucket: 'star-wars-d6-species.firebasestorage.app',
  messagingSenderId: '13155025417',
  appId: '1:13155025417:web:0b6c99afb060cb772aaed8',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;

// Emulator support removed: web app now reads species from local MySQL-backed API during development.
