/**
 * Firebase client SDK initialization
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration (baked into bundle for static hosting)
const firebaseConfig = {
  apiKey: 'AIzaSyAvN3w0J2lNXsnc8WjaPjvsljOyb-UCLww',
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
