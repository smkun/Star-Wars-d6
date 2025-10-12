import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import speciesApi from '../utils/speciesApi';
import { SearchBar } from '@/components/SearchBar';
import { SpeciesCard } from '@/components/SpeciesCard';
import type { SpeciesDocument } from '@/types';

const PAGE_SIZE = 20;

type FirestoreSpecies = Omit<SpeciesDocument, 'updatedAt'> & {
  updatedAt?: Date | string;
};

function mapSpecies(doc: any): SpeciesDocument {
  const updatedAtRaw = doc.updatedAt;
  const updatedAt = updatedAtRaw?.toDate
    ? updatedAtRaw.toDate()
    : updatedAtRaw
      ? new Date(updatedAtRaw)
      : new Date();

  return {
    ...doc,
    imagePath: doc.imagePath ?? undefined,
    hasImage: Boolean(doc.hasImage),
    sources: Array.isArray(doc.sources) ? doc.sources : [],
    stats: {
      ...doc.stats,
      attributes: doc.stats?.attributes ?? {},
    },
    updatedAt,
  };
}

export function CatalogPage() {
  const navigate = useNavigate();
  const [allSpecies, setAllSpecies] = useState<SpeciesDocument[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLetter, setActiveLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpecies() {
      try {
        setLoading(true);
        const raw = await speciesApi.fetchSpeciesList();
        const species = raw.map((d: any) => mapSpecies({ ...d, slug: d.slug }));
        setAllSpecies(species);
        setError(null);
      } catch (err) {
        console.error('Failed to load species', err);
        setError('Unable to load species. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    void loadSpecies();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, activeLetter]);

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    allSpecies.forEach((species) => {
      const letter = species.name?.charAt(0)?.toUpperCase();
      if (letter && /[A-Z]/.test(letter)) {
        letters.add(letter);
      }
    });
    return Array.from(letters).sort();
  }, [allSpecies]);

  const filteredSpecies = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    return allSpecies.filter((species) => {
      const firstLetter = species.name?.charAt(0)?.toUpperCase() ?? '';
      if (activeLetter && firstLetter !== activeLetter) {
        return false;
      }

      if (!tokens.length) {
        return true;
      }

      const haystack = [
        species.name,
        species.homeworld ?? '',
        species.description ?? '',
        species.sources?.join(' ') ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return tokens.every((token) => haystack.includes(token));
    });
  }, [allSpecies, searchTerm, activeLetter]);

  const visibleSpecies = filteredSpecies.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredSpecies.length;

  return (
    <div className="min-h-screen bg-[#090b13] text-gray-100">
      <header className="sticky top-0 z-10 border-b border-yellow-400/40 bg-[#101628]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-6">
            <img
              src="/d6StarWars/icons/Species.png"
              alt="Species"
              className="w-36 h-36 sm:w-48 sm:h-48 object-contain opacity-90 flex-shrink-0"
            />
            <div>
              <button
                type="button"
                className="mb-4 text-sm text-yellow-400/80 hover:text-yellow-400 transition-colors"
                onClick={() => navigate('/')}
              >
                ← Back to Home
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-yellow-400/80">
                Star Wars d6 Species Catalog
              </p>
              <h1 className="mt-4 text-5xl font-heading text-yellow-100 drop-shadow-[0_0_20px_rgba(255,213,79,0.25)] sm:text-6xl">
                Explore the Galaxy's Species
              </h1>
              <p className="mt-5 max-w-2xl text-sm text-gray-200/80 sm:text-base">
                Search and browse canon and legends species with quick stats,
                sources, and lore for your next adventure.
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-3xl px-4 pb-4 sm:px-10">
          <div className="rounded-xl border border-yellow-400/40 bg-[#101628]/80 px-4 py-3 shadow-[0_0_30px_rgba(255,213,79,0.1)]">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search species, homeworlds, or sources"
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
              Loading species from the Jedi archives…
            </p>
          )}

          {error && !loading && (
            <div className="rounded border border-red-500/40 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && filteredSpecies.length === 0 && (
            <div className="card mt-6 border border-yellow-500/30 bg-[#101628]/70 text-center shadow-[0_0_25px_rgba(255,213,79,0.08)]">
              <h2 className="font-heading text-xl text-yellow-200">
                No matches found
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Try searching by species name, homeworld, or a source title.
              </p>
            </div>
          )}

          <section className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSpecies.map((species) => (
              <SpeciesCard
                key={species.slug}
                species={species}
                onClick={() => navigate(`/species/${species.slug}`)}
              />
            ))}
          </section>

          {canLoadMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Load More Species
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CatalogPage;
