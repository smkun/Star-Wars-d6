import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '@/utils/firebase';

type Character = {
  id: string;
  user_id?: string;
  name?: string;
  species_slug?: string;
  created_at?: string;
  [k: string]: unknown;
};

type FirebaseUser = {
  uid: string;
  email: string;
  displayName: string;
};

export default function CharactersList() {
  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [users, setUsers] = useState<FirebaseUser[]>([]);

  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const user = auth.currentUser;
        if (user) {
          setUserEmail(user.email || null);
          const idTokenResult = await user.getIdTokenResult();
          console.log('[Admin Check] User:', user.email);
          console.log('[Admin Check] Claims:', idTokenResult.claims);
          console.log('[Admin Check] Admin claim:', idTokenResult.claims?.admin);
          const adminStatus = Boolean(idTokenResult.claims && idTokenResult.claims.admin);
          setIsAdmin(adminStatus);

          // Fetch users list if admin
          if (adminStatus) {
            const usersRes = await api.fetchWithAuth('/users');
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              setUsers(usersData || []);
            }
          }
        }

        const endpoint =
          showAll && isAdmin ? '/characters?all=true' : '/characters';
        const res = await api.fetchWithAuth(endpoint);
        if (!res.ok) {
          console.error('Failed to load characters', res.status);
          if (mounted) setChars([]);
          // store an error state so UI can show a dev retry
          if (mounted) setErrorStatus(res.status);
          return;
        }
        const data = await res.json();
        if (mounted) setChars(data || []);
        if (mounted) setErrorStatus(null);
      } catch (e) {
        console.error(e);
        if (mounted) setChars([]);
        if (mounted) setErrorStatus(500);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [showAll, isAdmin]);

  // retry fetch using a dev token when API returns 401
  async function fetchWithDevToken() {
    setLoading(true);
    try {
      const uid = import.meta.env.VITE_DEV_AUTH_UID || 'scottkunian@gmail.com';
      const token = `dev:${uid}`;
      const endpoint =
        showAll && isAdmin ? '/api/characters?all=true' : '/api/characters';
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error('Dev-token fetch failed', res.status);
        setErrorStatus(res.status);
        setChars([]);
        return;
      }
      const data = await res.json();
      setChars(data || []);
      setErrorStatus(null);
    } catch (e) {
      console.error(e);
      setErrorStatus(500);
      setChars([]);
    } finally {
      setLoading(false);
    }
  }

  // If all remote attempts fail, fall back to a static local sample for quick dev
  async function loadLocalSample() {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.BASE_URL}dev/characters-sample.json`
      );
      if (!res.ok) {
        console.error('Failed to load local sample', res.status);
        setChars([]);
        return;
      }
      const data = await res.json();
      setChars(data || []);
      setErrorStatus(null);
    } catch (err) {
      console.error('Local sample load error', err);
      setChars([]);
    } finally {
      setLoading(false);
    }
  }

  // Helper to get user display name from UID
  function getUserDisplayName(uid: string): string {
    const user = users.find((u) => u.uid === uid);
    return user ? user.email : uid;
  }

  async function reassignOwner(charId: string) {
    if (!newOwnerId.trim()) {
      alert('Please select a user');
      return;
    }

    try {
      const res = await api.fetchWithAuth(`/characters/${charId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: newOwnerId.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Failed to reassign: ${errData.error || res.status}`);
        return;
      }

      // Refresh the list
      setEditingCharId(null);
      setNewOwnerId('');

      const endpoint =
        showAll && isAdmin ? '/characters?all=true' : '/characters';
      const refreshRes = await api.fetchWithAuth(endpoint);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setChars(data || []);
      }
    } catch (err) {
      console.error('Reassign error:', err);
      alert('Failed to reassign character');
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-400">
      <header className="border-b-2 border-yellow-400 bg-gray-950">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-start gap-6">
            <img
              src={`${import.meta.env.BASE_URL}icons/Characters.png`}
              alt="Characters"
              className="w-36 h-36 sm:w-48 sm:h-48 object-contain opacity-90 flex-shrink-0"
            />
            <div>
              <Link
                to="/"
                className="mb-6 text-sm text-yellow-400/80 hover:text-yellow-400 transition-colors block"
              >
                ← Back to Home
              </Link>
              <h1 className="text-6xl font-bold mb-4">Character Sheets</h1>
              <p className="text-xl text-gray-400">
                Create and manage player characters
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-yellow-400">
            Your Characters
          </h2>
          <div className="flex items-center gap-4">
            {userEmail && (
              <div className="text-sm text-gray-400">
                Signed in as {userEmail}
              </div>
            )}
            {isAdmin && (
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                />
                Show all
              </label>
            )}
            {errorStatus && (
              <>
                <button
                  onClick={() => fetchWithDevToken()}
                  className="px-3 py-1 bg-yellow-500 text-gray-900 rounded font-semibold"
                >
                  Try dev token
                </button>
                <button
                  onClick={() => loadLocalSample()}
                  className="px-3 py-1 bg-yellow-700 text-gray-100 rounded font-semibold"
                >
                  Show local sample
                </button>
              </>
            )}
            {userEmail && (
              <button
                onClick={async () => {
                  try {
                    await auth.signOut();
                  } finally {
                    navigate('/login', { replace: true });
                  }
                }}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                Sign Out
              </button>
            )}
            <Link
              to="/characters/new"
              className="inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-300"
            >
              Create New Character
            </Link>
          </div>
        </div>

        {loading ? (
          <div>Loading characters...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chars.length === 0 && (
              <div className="bg-gray-800 p-6 rounded border border-yellow-400/20">
                No characters yet
              </div>
            )}
            {chars.map((c) => (
              <div
                key={c.id}
                className="bg-gray-800 p-6 rounded border border-yellow-400/20"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-yellow-400">
                      {c.name}
                    </h3>
                    <div className="text-gray-400 mt-2">
                      {c.species_slug || 'Unknown species'}
                    </div>
                    {isAdmin && showAll && (
                      <div className="text-sm text-gray-500 mt-1">
                        Owner: {getUserDisplayName(c.user_id || '')}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {c.created_at
                      ? new Date(c.created_at).toLocaleString()
                      : ''}
                  </div>
                </div>
                <div className="mt-4 flex gap-4 items-center flex-wrap">
                  <Link
                    to={`/characters/${c.id}`}
                    className="text-yellow-400 hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    to={`/characters/${c.id}/print`}
                    target="_blank"
                    className="text-yellow-400 hover:underline"
                  >
                    Print
                  </Link>
                  {isAdmin && showAll && (
                    <>
                      {editingCharId === c.id ? (
                        <div className="flex gap-2 items-center">
                          <select
                            value={newOwnerId}
                            onChange={(e) => setNewOwnerId(e.target.value)}
                            className="bg-gray-900 border border-yellow-400/30 rounded px-2 py-1 text-sm text-yellow-400"
                          >
                            <option value="">Select user...</option>
                            {users.map((u) => (
                              <option key={u.uid} value={u.uid}>
                                {u.displayName} ({u.email})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => reassignOwner(c.id)}
                            className="px-2 py-1 bg-yellow-400 text-gray-900 rounded text-sm font-semibold hover:bg-yellow-300"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingCharId(null);
                              setNewOwnerId('');
                            }}
                            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingCharId(c.id);
                            setNewOwnerId(c.user_id || '');
                          }}
                          className="text-yellow-400 hover:underline text-sm"
                        >
                          Reassign
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
