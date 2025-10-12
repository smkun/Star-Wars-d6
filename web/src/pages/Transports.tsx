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

/**
 * Detect family based on common transport naming patterns
 * Returns family name if detected, null otherwise
 */
function detectFamily(shipName: string): string | null {
  // YT-Series (Millennium Falcon family)
  if (/^YT-?\s*\d+/.test(shipName)) return 'YT-Series';

  // YV-Series
  if (/^YV-\d+/.test(shipName)) return 'YV-Series';

  // Action Series (Action IV, Action V, Action VI)
  if (/^Action\s+(IV|V|VI)/.test(shipName)) return 'Action Series';

  // Baudo-class
  if (/^Baudo.*class/i.test(shipName)) return 'Baudo-class';

  // Lambda-class shuttles
  if (/^Lambda.*class/i.test(shipName)) return 'Lambda-class';

  // Gymsnor-class
  if (/^Gymsnor.*class/i.test(shipName)) return 'Gymsnor-class';

  // Ghtroc (Ghtroc 720, Ghtroc 690, etc.)
  if (/^Ghtroc\s+\d+/.test(shipName)) return 'Ghtroc Series';

  // Corellian Engineering ships (often have "Corellian" in name)
  if (/^Corellian\s+/i.test(shipName)) return 'Corellian Engineering';

  // Sienar Fleet Systems (TIE-based transports)
  if (/^(TIE|Sentinel).*class/i.test(shipName)) return 'Sienar Fleet Systems';

  // Space Master medium transports
  if (/^Space Master/i.test(shipName)) return 'Space Master Series';

  // Star Galleon series
  if (/^Star Galleon/i.test(shipName)) return 'Star Galleon Series';

  // Bulk series (Bulk Cruiser, Bulk Freighter, etc.)
  if (/^Bulk\s+(Cruiser|Freighter)/i.test(shipName))
    return 'Bulk Transport Series';

  // Starlight series
  if (/^Starlight/i.test(shipName)) return 'Starlight Series';

  return null;
}

const PAGE_SIZE = 20;

export default function Transports() {
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
        // Filter transports client-side
        const transports = ships.filter(
          (s: any) => s.category === 'transport' || s.type === 'transport'
        );
        setStarships(transports as Starship[]);
      } catch (error) {
        console.error('Error fetching transports:', error);
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

    return starships.filter((ship) => {
      const firstLetter = ship.name?.charAt(0)?.toUpperCase() ?? '';
      if (activeLetter && firstLetter !== activeLetter) {
        return false;
      }

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
  }, [starships, searchTerm, activeLetter]);

  // Group transports by family (parent field or pattern detection)
  const { families, standalone } = useMemo(() => {
    const familyMap = new Map<
      string,
      { base?: Starship; variants: Starship[] }
    >();
    const standalone: Starship[] = [];

    filteredStarships.forEach((ship) => {
      // First, check if ship has explicit parent field (database-defined family)
      if (ship.parent && !ship.isVariant) {
        // This is the base ship
        const familyName = ship.parent;
        const existing = familyMap.get(familyName) || { variants: [] };
        existing.base = ship;
        familyMap.set(familyName, existing);
      } else if (ship.parent && ship.isVariant) {
        // This is a variant
        const familyName = ship.parent;
        const existing = familyMap.get(familyName) || { variants: [] };
        existing.variants.push(ship);
        familyMap.set(familyName, existing);
      } else {
        // No explicit parent - try pattern detection
        const detectedFamily = detectFamily(ship.name);
        if (detectedFamily) {
          const existing = familyMap.get(detectedFamily) || { variants: [] };
          existing.variants.push(ship);
          familyMap.set(detectedFamily, existing);
        } else {
          // No family detected
          standalone.push(ship);
        }
      }
    });

    // Filter out small "families" - only show as family if 3+ variants OR has base ship
    const validFamilies = new Map<
      string,
      { base?: Starship; variants: Starship[] }
    >();
    familyMap.forEach((familyData, familyName) => {
      const hasBaseShip = !!familyData.base;
      const variantCount = familyData.variants.length;

      if (variantCount >= 3 || hasBaseShip) {
        validFamilies.set(familyName, familyData);
      } else {
        // Too small to be a family - add variants to standalone list
        standalone.push(...familyData.variants);
        if (familyData.base) {
          standalone.push(familyData.base);
        }
      }
    });

    return {
      families: Array.from(validFamilies.entries()).sort((a, b) =>
        a[0].localeCompare(b[0])
      ),
      standalone: standalone.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [filteredStarships]);

  const visibleFamilies = families.slice(0, visibleCount);
  const visibleStandalone = standalone.slice(0, visibleCount);
  const totalVisible = visibleFamilies.length + visibleStandalone.length;
  const canLoadMore = totalVisible < families.length + standalone.length;

  return (
    <div className="min-h-screen bg-[#090b13] text-gray-100">
      <header className="sticky top-0 z-10 border-b border-yellow-400/40 bg-[#101628]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-6">
            <img
              src="/d6StarWars/icons/SpaceTransports.png"
              alt="Space Transports"
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
                Space Transports
              </h1>
              <p className="mt-5 max-w-2xl text-sm text-gray-200/80 sm:text-base">
                Freighters, cargo haulers, and passenger vessels that form the
                backbone of galactic commerce.
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-3xl px-4 pb-4 sm:px-10">
          <div className="rounded-xl border border-yellow-400/40 bg-[#101628]/80 px-4 py-3 shadow-[0_0_30px_rgba(255,213,79,0.1)]">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search transports by name or craft"
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
              Loading transports from the Imperial Registry...
            </p>
          )}

          {!loading && filteredStarships.length === 0 && (
            <div className="card mt-6 border border-yellow-500/30 bg-[#101628]/70 text-center shadow-[0_0_25px_rgba(255,213,79,0.08)]">
              <h2 className="font-heading text-xl text-yellow-200">
                No transports found
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Try searching by ship name or craft designation.
              </p>
            </div>
          )}

          {!loading && filteredStarships.length > 0 && (
            <>
              {/* Transport Families Section */}
              {visibleFamilies.length > 0 && (
                <section className="space-y-6 mb-10">
                  <h2 className="text-2xl font-heading text-yellow-100 mb-6">
                    Transport Families
                  </h2>
                  {visibleFamilies.map(([familyName, familyData]) => (
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

              {/* Standalone Transports Section */}
              {visibleStandalone.length > 0 && (
                <section>
                  <h2 className="text-2xl font-heading text-yellow-100 mb-6">
                    {families.length > 0
                      ? 'Other Transports'
                      : 'All Transports'}
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleStandalone.map((ship) => (
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
                    onClick={() =>
                      setVisibleCount((count) => count + PAGE_SIZE)
                    }
                  >
                    Load More Transports
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
