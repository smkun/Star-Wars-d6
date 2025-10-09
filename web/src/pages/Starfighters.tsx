import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, getFirestore, orderBy, query, where } from 'firebase/firestore';
import { SearchBar } from '@/components/SearchBar';
import { StarshipCard } from '@/components/StarshipCard';

interface Weapon {
  name: string;
  fireArc?: string;
  damage?: string;
  fireControl?: string;
  spaceRange?: string;
}

interface Starship {
  id: string;
  name: string;
  craft?: string;
  affiliation?: string;
  type?: string;
  category: string;
  scale?: string;
  length?: string;
  crew?: string;
  hyperdrive?: string;
  maneuverability?: string;
  space?: string;
  hull?: string;
  shields?: string;
  weapons: Weapon[];
  imageUrl?: string;
  isVariant?: boolean;
  parent?: string;
}

const PAGE_SIZE = 20;

export default function Starfighters() {
  const navigate = useNavigate();
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLetter, setActiveLetter] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchStarships = async () => {
      try {
        const db = getFirestore();
        const q = query(
          collection(db, 'starships'),
          where('category', '==', 'starfighter'),
          orderBy('name')
        );
        const snapshot = await getDocs(q);

        const ships = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Starship));

        setStarships(ships);
      } catch (error) {
        console.error('Error fetching starfighters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStarships();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, activeLetter]);

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    starships.forEach((ship) => {
      const letter = ship.name?.charAt(0)?.toUpperCase();
      if (letter && /[A-Z]/.test(letter)) {
        letters.add(letter);
      }
    });
    return Array.from(letters).sort();
  }, [starships]);

  const filteredStarships = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    // First filter by search ONLY (not letter yet)
    const filtered = starships.filter((ship) => {
      if (!tokens.length) {
        return true;
      }

      const haystack = [
        ship.name,
        ship.craft ?? '',
        ship.affiliation ?? '',
        ship.type ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return tokens.every((token) => haystack.includes(token));
    });

    // Group variants: show only parent ships, not individual variants
    const grouped = new Map<string, Starship>();
    const variantFamilies = new Map<string, Starship[]>();

    // First pass: separate variants and non-variants
    filtered.forEach((ship) => {
      if (ship.isVariant && ship.parent) {
        // This is a variant - group it under its parent
        const parentKey = ship.parent
          .replace(/'''/g, '')
          .replace(/\[\[|\]\]/g, '')
          .replace(/Running the /i, '')
          .replace(/ Starfighters?$/i, '')
          .replace(/ Description$/i, '')
          .trim();

        // Skip self-referential variants (ship name matches parent name)
        if (ship.name.toLowerCase() === parentKey.toLowerCase()) {
          return;
        }

        if (!variantFamilies.has(parentKey)) {
          variantFamilies.set(parentKey, []);
        }
        variantFamilies.get(parentKey)!.push(ship);
      } else {
        // This is a standalone ship (not a variant) - add it directly
        grouped.set(ship.id, ship);
      }
    });

    // Second pass: create synthetic family entries for variant groups
    // BUT: if a real base ship exists (matching parent name, not a variant), use that instead
    // Fixed: TIE Fighter now uses real base document instead of synthetic entry
    variantFamilies.forEach((variants, parentKey) => {
      if (variants.length > 0) {
        // Check if a real base ship exists with this parent name
        const realBaseShip = Array.from(grouped.values()).find(
          (ship) => ship.name === parentKey && !ship.isVariant
        );

        if (realBaseShip) {
          // Real base ship exists - keep it, don't create synthetic entry
          return;
        }

        // No real base ship - create synthetic family entry
        const familyEntry = {
          ...variants[0],
          id: `family-${parentKey.toLowerCase().replace(/\s+/g, '-')}`,
          name: parentKey,
          isVariant: false,
          parent: undefined,
        };

        // Use the family ID as the key to avoid conflicts
        grouped.set(familyEntry.id, familyEntry);
      }
    });

    // Now apply letter filter to the grouped results
    let finalList = Array.from(grouped.values());

    if (activeLetter) {
      finalList = finalList.filter((ship) => {
        const firstLetter = ship.name?.charAt(0)?.toUpperCase() ?? '';
        return firstLetter === activeLetter;
      });
    }

    // Sort alphabetically by name
    return finalList.sort((a, b) => a.name.localeCompare(b.name));
  }, [starships, searchTerm, activeLetter]);

  const visibleStarships = filteredStarships.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredStarships.length;

  return (
    <div className='min-h-screen bg-[#090b13] text-gray-100'>
      <header className='sticky top-0 z-10 border-b border-yellow-400/40 bg-[#101628]/90 backdrop-blur'>
        <div className='mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-end sm:justify-between'>
          <div className='flex items-start gap-6'>
            <img
              src='/d6StarWars/icons/Starfighters.png'
              alt='Starfighters'
              className='w-36 h-36 sm:w-48 sm:h-48 object-contain opacity-90 flex-shrink-0'
            />
            <div>
              <button
                type='button'
                className='mb-4 text-sm text-yellow-400/80 hover:text-yellow-400 transition-colors'
                onClick={() => navigate('/starships')}
              >
                ← Back to Starships
              </button>
              <p className='text-xs font-semibold uppercase tracking-[0.45em] text-yellow-400/80'>
                Star Wars d6 Starship Database
              </p>
              <h1 className='mt-4 text-5xl font-heading text-yellow-100 drop-shadow-[0_0_20px_rgba(255,213,79,0.25)] sm:text-6xl'>
                Starfighters
              </h1>
              <p className='mt-5 max-w-2xl text-sm text-gray-200/80 sm:text-base'>
                Fast, agile spacecraft designed for dogfighting and tactical combat missions.
              </p>
            </div>
          </div>
        </div>
        <div className='mx-auto mt-6 max-w-3xl px-4 pb-4 sm:px-10'>
          <div className='rounded-xl border border-yellow-400/40 bg-[#101628]/80 px-4 py-3 shadow-[0_0_30px_rgba(255,213,79,0.1)]'>
            <SearchBar onSearch={setSearchTerm} placeholder='Search starfighters by name or craft' />
          </div>
          {availableLetters.length > 0 && (
            <div className='mt-4 flex flex-wrap gap-2 text-sm text-yellow-200/80'>
              <button
                type='button'
                className={`rounded-full border px-3 py-1 uppercase tracking-[0.2em] transition-colors ${
                  activeLetter === ''
                    ? 'border-yellow-400 bg-yellow-400 text-[#101628]'
                    : 'border-yellow-400/30 bg-transparent hover:border-yellow-400'
                }`}
                onClick={() => setActiveLetter('')}
              >
                All
              </button>
              {availableLetters.map((letter) => (
                <button
                  key={letter}
                  type='button'
                  className={`rounded-full border px-3 py-1 uppercase tracking-[0.2em] transition-colors ${
                    activeLetter === letter
                      ? 'border-yellow-400 bg-yellow-400 text-[#101628]'
                      : 'border-yellow-400/30 bg-transparent hover:border-yellow-400'
                  }`}
                  onClick={() => setActiveLetter(letter)}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className='relative mx-auto max-w-6xl px-4 py-14'>
        <div className='pointer-events-none absolute inset-x-0 top-0 hidden h-40 bg-[radial-gradient(circle_at_top,_rgba(255,213,79,0.18),_transparent_65%)] sm:block' aria-hidden='true' />
        <div className='relative'>
          {loading && (
            <p className="text-gray-400">Loading starfighters from the Imperial Registry...</p>
          )}

          {!loading && filteredStarships.length === 0 && (
            <div className='card mt-6 border border-yellow-500/30 bg-[#101628]/70 text-center shadow-[0_0_25px_rgba(255,213,79,0.08)]'>
              <h2 className='font-heading text-xl text-yellow-200'>No starfighters found</h2>
              <p className='mt-2 text-sm text-gray-400'>
                Try searching by ship name or craft designation.
              </p>
            </div>
          )}

          <section className='grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3'>
            {visibleStarships.map((ship) => {
              // If ship ID starts with 'family-', it's a grouped parent - link to family page
              // Otherwise link to detail page
              const url = ship.id.startsWith('family-')
                ? `/starships/family/${ship.id.replace('family-', '')}`
                : `/starships/${ship.id}`;

              return (
                <StarshipCard
                  key={ship.id}
                  ship={ship}
                  onClick={() => navigate(url)}
                />
              );
            })}
          </section>

          {canLoadMore && (
            <div className='mt-10 flex justify-center'>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Load More Starfighters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
