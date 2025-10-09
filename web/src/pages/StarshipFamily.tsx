import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { StarshipCard } from '@/components/StarshipCard';

interface Starship {
  id: string;
  name: string;
  craft?: string;
  category: string;
  hull?: string;
  shields?: string;
  weapons: any[];
  imageUrl?: string;
  imageFilename?: string;
  parent?: string;
  isVariant?: boolean;
}

export function StarshipFamilyPage() {
  const { family } = useParams<{ family: string }>();
  const navigate = useNavigate();
  const [variants, setVariants] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clean up the family name for display with proper capitalization
  const displayName = family
    ? family
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('-')
    : '';

  useEffect(() => {
    async function loadVariants() {
      if (!family) {
        navigate('/starfighters', { replace: true });
        return;
      }

      try {
        setLoading(true);
        const db = getFirestore();

        // Convert URL slug back to proper capitalization
        // e.g., "x-wing" -> "X-Wing", "y-wing" -> "Y-Wing"
        const words = family.split('-');
        const capitalizedName = words
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('-');

        console.log('Looking for variants of:', capitalizedName);

        // Query all variants and filter by matching family name
        const q = query(
          collection(db, 'starships'),
          where('isVariant', '==', true),
          orderBy('name')
        );

        const snapshot = await getDocs(q);
        const ships: Starship[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data() as Starship;
          // Check if parent matches the family name (case-insensitive)
          if (data.parent) {
            const parentClean = data.parent
              .replace(/'''/g, '')  // Remove triple quotes
              .replace(/\[\[|\]\]/g, '')  // Remove wiki brackets
              .replace(/Running the /i, '')  // Remove "Running the"
              .replace(/ Starfighters?$/i, '')  // Remove "Starfighter" or "Starfighters" suffix
              .replace(/ Description$/i, '')  // Remove "Description" suffix
              .trim()
              .toLowerCase();

            if (parentClean === capitalizedName.toLowerCase()) {
              ships.push({ id: doc.id, ...data });
            }
          }
        });

        console.log('Found variants:', ships.length);

        // Sort variants: put those with images first
        ships.sort((a, b) => {
          if (a.imageUrl && !b.imageUrl) return -1;
          if (!a.imageUrl && b.imageUrl) return 1;
          return a.name.localeCompare(b.name);
        });

        setVariants(ships);
        setError(null);
      } catch (err) {
        console.error('Error loading variants:', err);
        setError(`Unable to load variants. ${err instanceof Error ? err.message : 'Please try again later.'}`);
      } finally {
        setLoading(false);
      }
    }

    void loadVariants();
  }, [family, navigate]);

  if (loading) {
    return (
      <main className='mx-auto max-w-7xl px-4 py-20 text-gray-300'>
        Loading variants…
      </main>
    );
  }

  if (error) {
    return (
      <main className='mx-auto max-w-7xl px-4 py-20 text-center'>
        <div className='card bg-[#101628]/80 border border-red-500/40 text-red-200'>
          <p>{error}</p>
          <button
            type='button'
            className='btn-secondary mt-4'
            onClick={() => navigate('/starfighters')}
          >
            Back to starfighters
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className='mx-auto max-w-7xl px-4 py-8 text-gray-100'>
      <button
        type='button'
        className='btn-ghost mb-6'
        onClick={() => navigate('/starfighters')}
      >
        ← Back to Starfighters
      </button>

      <header className='mb-8'>
        <h1 className='text-4xl font-heading text-yellow-200 drop-shadow-[0_0_20px_rgba(255,213,79,0.3)] sm:text-5xl'>
          {displayName} Variants
        </h1>
        <p className='mt-2 text-gray-400'>
          {variants.length} {variants.length === 1 ? 'variant' : 'variants'} found
        </p>
      </header>

      {variants.length === 0 ? (
        <div className='card border border-yellow-500/30 bg-[#101628]/80 text-center'>
          <p className='text-gray-300'>No variants found for this starship family.</p>
        </div>
      ) : (() => {
        // Find the first variant with an image to use as fallback for others
        const genericImage = variants.find(v => v.imageUrl)?.imageUrl;

        return (
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {variants.map((ship) => (
              <StarshipCard
                key={ship.id}
                ship={ship}
                onClick={() => navigate(`/starships/${ship.id}`)}
                fallbackImageUrl={genericImage}
              />
            ))}
          </div>
        );
      })()}
    </main>
  );
}

export default StarshipFamilyPage;
