import { db } from './firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

// Build API URL with base path support
function getApiUrl(path: string): string {
  // In development, use absolute localhost URL to bypass Vite routing
  if (import.meta.env.DEV) {
    return `http://localhost:4000${path}`;
  }
  // In production, always hit the API root at /api so it can be proxied by Apache/Node
  return `/api${path}`;
}

// Default to using the local MySQL-backed API for species data.
export async function fetchSpeciesList() {
  const url = getApiUrl('/species');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch species');
  return res.json();
}

export async function fetchSpeciesBySlug(slug: string) {
  const url = getApiUrl(`/species/${encodeURIComponent(slug)}`);
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

export default { fetchSpeciesList, fetchSpeciesBySlug };
