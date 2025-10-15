import { db } from './firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

// Build API URL with base path support
function getApiUrl(path: string): string {
  // Always use /api path - Vite proxy will route to port 3000 in dev, Apache/Node will handle in prod
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
