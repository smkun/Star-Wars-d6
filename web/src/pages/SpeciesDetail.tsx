import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import speciesApi from '@/utils/speciesApi';
import type { SpeciesDocument } from '@/types';
import { AbilitiesPanel } from '@/components/AbilitiesPanel';
import { StatsTable } from '@/components/StatsTable';
import { ImagePlaceholder } from '@/components/ImagePlaceholder';

function normalizeSpecies(data: SpeciesDocument): SpeciesDocument {
  return {
    ...data,
    sources: data.sources ?? [],
    stats: {
      ...data.stats,
      attributes: data.stats?.attributes ?? {},
    },
    hasImage: Boolean(data.hasImage),
    imagePath: data.imagePath ?? undefined,
  };
}

export function SpeciesDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [species, setSpecies] = useState<SpeciesDocument | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!slug) {
        navigate('/', { replace: true });
        return;
      }

      try {
        setLoading(true);
        const data = await speciesApi.fetchSpeciesBySlug(slug);
        if (!data) {
          setError('Species not found.');
          setSpecies(null);
          return;
        }
        setSpecies(normalizeSpecies({ ...data, slug }));
        setImageFailed(false);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Unable to load species. Please try again later.');
        setSpecies(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [slug, navigate]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-gray-300">
        Loading species details…
      </main>
    );
  }

  if (error || !species) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="card bg-[#101628]/80 border border-red-500/40 text-red-200">
          <p>{error ?? 'Species not found.'}</p>
          <button
            type="button"
            className="btn-secondary mt-4"
            onClick={() => navigate('/')}
          >
            Back to catalog
          </button>
        </div>
      </main>
    );
  }

  const assetPath = species.imagePath || species.imageUrl || '';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const imageSrc = assetPath
    ? `${normalizedBase}aliens/${assetPath.replace(/^\/+/, '')}`
    : '';

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 text-gray-100">
      <button
        type="button"
        className="btn-ghost mb-6"
        onClick={() => navigate(-1)}
      >
        ← Back to catalog
      </button>

      <section className="card grid gap-8 border border-yellow-500/30 bg-[#101628]/80 shadow-[0_0_35px_rgba(255,213,79,0.08)] sm:grid-cols-[320px_1fr]">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-[360px] w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-yellow-400/30 bg-[#11172c] p-4 shadow-[0_0_30px_rgba(255,213,79,0.12)]">
            {!imageFailed && imageSrc ? (
              <img
                src={imageSrc}
                alt={species.name}
                className="h-full w-full object-contain"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <ImagePlaceholder
                name={species.name}
                size="large"
                className="h-full w-full max-w-md"
              />
            )}
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-heading text-yellow-200 drop-shadow-[0_0_20px_rgba(255,213,79,0.3)]">
              {species.name}
            </h1>
            {species.homeworld && (
              <p className="mt-2 text-sm uppercase tracking-[0.35em] text-yellow-400/70">
                {species.homeworld}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-gray-200/90">{species.description}</p>

          <StatsTable stats={species.stats} />

          {species.personality && (
            <div>
              <h2 className="text-lg font-heading text-yellow-200">
                Personality
              </h2>
              <p className="mt-2 text-gray-200/80">{species.personality}</p>
            </div>
          )}

          {species.physicalDescription && (
            <div>
              <h2 className="text-lg font-heading text-yellow-200">
                Physical Description
              </h2>
              <p className="mt-2 text-gray-200/80">
                {species.physicalDescription}
              </p>
            </div>
          )}

          {species.adventurers && (
            <div>
              <h2 className="text-lg font-heading text-yellow-200">
                Adventurers
              </h2>
              <p className="mt-2 text-gray-200/80">{species.adventurers}</p>
            </div>
          )}

          {species.languages?.description && (
            <div>
              <h2 className="text-lg font-heading text-yellow-200">Languages</h2>
              <p className="mt-2 text-gray-200/80">
                {species.languages.description}
              </p>
            </div>
          )}

          <AbilitiesPanel
            specialAbilities={species.specialAbilities ?? []}
            storyFactors={species.storyFactors ?? []}
          />

          {species.sources?.length ? (
            <div>
              <h2 className="text-lg font-heading text-yellow-200">Sources</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-200/80">
                {species.sources.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default SpeciesDetailPage;
