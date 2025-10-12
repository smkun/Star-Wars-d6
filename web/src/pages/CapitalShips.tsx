import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { StarshipCard } from '@/components/StarshipCard';
import { StarfighterFamilyGroup } from '@/components/StarfighterFamilyGroup';

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

export default function CapitalShips() {
  const navigate = useNavigate();
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLetter, setActiveLetter] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchStarships = async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${baseUrl}data/starships.json`);
        if (!response.ok) throw new Error('Failed to fetch starships');
        const all = await response.json();
        const ships = Array.isArray(all) ? all : [];
        // Filter capital ships client-side
        const capitals = ships.filter(
          (s: any) => s.category === 'capital'
        );
        setStarships(capitals as Starship[]);
      } catch (error) {
        console.error('Error fetching capital ships:', error);
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

  // Group capital ships by family
  const { families, standaloneShips } = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    // First filter by search
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

    // Group by family
    const familyMap = new Map<
      string,
      { base?: Starship; variants: Starship[] }
    >();
    const standalone: Starship[] = [];

    filtered.forEach((ship) => {
      if (ship.isVariant && ship.parent) {
        // Clean up parent name
        const parentKey = ship.parent
          .replace(/'''/g, '')
          .replace(/\[\[|\]\]/g, '')
          .replace(/Running the /i, '')
          .replace(/ Starfighters?$/i, '')
          .replace(/ Description$/i, '')
          .trim();

        // Skip self-referential
        if (ship.name.toLowerCase() === parentKey.toLowerCase()) {
          return;
        }

        if (!familyMap.has(parentKey)) {
          familyMap.set(parentKey, { variants: [] });
        }
        familyMap.get(parentKey)!.variants.push(ship);
      } else if (!ship.isVariant) {
        // Check if this is a base ship for a family
        const matchingFamily = Array.from(familyMap.entries()).find(
          ([familyName]) => familyName.toLowerCase() === ship.name.toLowerCase()
        );

        if (matchingFamily) {
          // This is the base ship for an existing family
          familyMap.get(matchingFamily[0])!.base = ship;
        } else {
          // This is a standalone ship
          standalone.push(ship);
        }
      }
    });

    // Filter out small "families" - only show as family if 3+ variants OR has base ship
    // Small families (1-2 variants without base) should be shown as standalone ships
    const validFamilies = new Map<
      string,
      { base?: Starship; variants: Starship[] }
    >();

    familyMap.forEach((familyData, familyName) => {
      const hasBaseShip = !!familyData.base;
      const variantCount = familyData.variants.length;

      // Only treat as family if:
      // - Has 3+ variants, OR
      // - Has a real base ship document
      if (variantCount >= 3 || hasBaseShip) {
        validFamilies.set(familyName, familyData);
      } else {
        // Too small to be a family - add variants to standalone list
        standalone.push(...familyData.variants);
      }
    });

    // Apply letter filter
    let filteredFamilies = Array.from(validFamilies.entries());
    if (activeLetter) {
      filteredFamilies = filteredFamilies.filter(([familyName]) => {
        const firstLetter = familyName.charAt(0).toUpperCase();
        return firstLetter === activeLetter;
      });
    }

    let filteredStandalone = standalone;
    if (activeLetter) {
      filteredStandalone = standalone.filter((ship) => {
        const firstLetter = ship.name?.charAt(0)?.toUpperCase() ?? '';
        return firstLetter === activeLetter;
      });
    }

    // Sort families by name
    filteredFamilies.sort((a, b) => a[0].localeCompare(b[0]));
    filteredStandalone.sort((a, b) => a.name.localeCompare(b.name));

    return {
      families: filteredFamilies,
      standaloneShips: filteredStandalone,
    };
  }, [starships, searchTerm, activeLetter]);

  const totalItems = families.length + standaloneShips.length;
  const canLoadMore = visibleCount < totalItems;

  return (
    <div className="min-h-screen bg-[#090b13] text-gray-100">
      <header className="sticky top-0 z-10 border-b border-yellow-400/40 bg-[#101628]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-6">
            <img
              src="/d6StarWars/icons/CapitalShips.png"
              alt="Capital Ships"
              className="w-36 h-36 sm:w-48 sm:h-48 object-contain opacity-90 flex-shrink-0"
            />
            <div>
              <button
                type="button"
                className="mb-4 text-sm text-yellow-400/80 hover:text-yellow-400 transition-colors"
                onClick={() => navigate('/starships')}
              >
                ← Back to Starships
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-yellow-400/80">
                Star Wars d6 Starship Database
              </p>
              <h1 className="mt-4 text-5xl font-heading text-yellow-100 drop-shadow-[0_0_20px_rgba(255,213,79,0.25)] sm:text-6xl">
                Capital Ships
              </h1>
              <p className="mt-5 max-w-2xl text-sm text-gray-200/80 sm:text-base">
                Massive warships, cruisers, and dreadnoughts that command fleets
                and dominate space battles.
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-3xl px-4 pb-4 sm:px-10">
          <div className="rounded-xl border border-yellow-400/40 bg-[#101628]/80 px-4 py-3 shadow-[0_0_30px_rgba(255,213,79,0.1)]">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search capital ships by name or class"
            />
          </div>
          {availableLetters.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-yellow-200/80">
              <button
                type="button"
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
                  type="button"
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

      <main className="relative mx-auto max-w-6xl px-4 py-14">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-40 bg-[radial-gradient(circle_at_top,_rgba(255,213,79,0.18),_transparent_65%)] sm:block"
          aria-hidden="true"
        />
        <div className="relative">
          {loading && (
            <p className="text-gray-400">
              Loading capital ships from the Imperial Registry...
            </p>
          )}

          {!loading && totalItems === 0 && (
            <div className="card mt-6 border border-yellow-500/30 bg-[#101628]/70 text-center shadow-[0_0_25px_rgba(255,213,79,0.08)]">
              <h2 className="font-heading text-xl text-yellow-200">
                No capital ships found
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Try searching by ship name or craft designation.
              </p>
            </div>
          )}

          {/* Capital Ship Families */}
          {families.length > 0 && (
            <section className="space-y-6 pt-6">
              <h2 className="text-2xl font-bold text-yellow-100 border-b border-yellow-400/30 pb-2">
                Capital Ship Families
              </h2>
              {families.map(([familyName, familyData]) => (
                <StarfighterFamilyGroup
                  key={familyName}
                  familyName={familyName}
                  baseShip={familyData.base}
                  variants={familyData.variants}
                  defaultExpanded={families.length <= 3}
                />
              ))}
            </section>
          )}

          {/* Standalone Capital Ships */}
          {standaloneShips.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-yellow-100 border-b border-yellow-400/30 pb-2 mb-6">
                Other Capital Ships
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {standaloneShips
                  .slice(0, visibleCount - families.length)
                  .map((ship) => (
                    <StarshipCard
                      key={ship.id}
                      ship={ship}
                      onClick={() => navigate(`/starships/${ship.id}`)}
                    />
                  ))}
              </div>
            </section>
          )}

          {canLoadMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Load More Capital Ships
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
