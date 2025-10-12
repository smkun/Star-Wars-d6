import { auth } from './firebase';

async function getIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function fetchWithAuth(
  input: RequestInfo,
  init: RequestInit = {}
) {
  let token = await getIdToken();

  // Dev mode fallback: use dev token if no Firebase user is signed in
  if (!token && import.meta.env.DEV) {
    const devUid = import.meta.env.VITE_DEV_AUTH_UID || 'scottkunian@gmail.com';
    token = `dev:${devUid}`;
    console.log('[DEV] Using dev auth token:', devUid);
  }

  const headers = new Headers();
  const maybeHeaders = (init as RequestInit).headers;
  if (maybeHeaders) {
    // HeadersInit can be Headers, string[][], or Record<string,string>
    if (maybeHeaders instanceof Headers) {
      maybeHeaders.forEach((v, k) => headers.set(k, v));
    } else if (Array.isArray(maybeHeaders)) {
      maybeHeaders.forEach(([k, v]) => headers.set(k, v));
    } else {
      Object.entries(maybeHeaders as Record<string, string>).forEach(([k, v]) =>
        headers.set(k, v)
      );
    }
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // If caller passed a relative API path like '/characters', route it through
  // the Vite dev proxy by prefixing '/api' so requests go to the running
  // local API server at localhost:4000 (configured in vite.config.ts).
  let resolvedInput = input;
  try {
    if (typeof input === 'string' && input.startsWith('/')) {
      // don't double-prefix if already '/api'
      if (!input.startsWith('/api')) {
        resolvedInput = `/api${input}`;
      }
    }
  } catch {
    // fall back to original input
    resolvedInput = input;
  }

  return fetch(resolvedInput, { ...init, headers });
}

export default { fetchWithAuth };
