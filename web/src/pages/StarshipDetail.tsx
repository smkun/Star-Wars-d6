import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

interface Weapon {
  name: string;
  fireArc?: string;
  scale?: string;
  skill?: string;
  fireControl?: string;
  spaceRange?: string;
  atmosphereRange?: string;
  damage?: string;
  ammo?: string;
  description?: string;
}

interface SensorRange {
  passive?: string;
  scan?: string;
  search?: string;
  focus?: string;
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
  crewSkill?: string;
  passengers?: string;
  cargoCapacity?: string;
  consumables?: string;
  cost?: string;
  skill?: string;
  hyperdrive?: string;
  navComputer?: string;
  maneuverability?: string;
  space?: string;
  atmosphere?: string;
  hull?: string;
  shields?: string;
  sensors?: SensorRange;
  weapons: Weapon[];
  description?: string;
  imageUrl?: string;
  imageFilename?: string;
  parent?: string;
  variantOf?: string;
  isVariant?: boolean;
  notes?: string;
  sources: string[];
}

export function StarshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [starship, setStarship] = useState<Starship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) {
        navigate('/starships', { replace: true });
        return;
      }

      try {
        setLoading(true);
        const db = getFirestore();
        const docRef = doc(db, 'starships', id);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
          setError('Starship not found.');
          setStarship(null);
          return;
        }

        const data = snapshot.data() as Starship;
        setStarship({ ...data, id });
        setImageFailed(false);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Unable to load starship. Please try again later.');
        setStarship(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id, navigate]);

  if (loading) {
    return (
      <main className='mx-auto max-w-5xl px-4 py-20 text-gray-300'>
        Loading starship details…
      </main>
    );
  }

  // Category-based navigation mappings
  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      starfighter: {
        label: 'Starfighter',
        path: '/starfighters',
        backLabel: 'Back to Starfighters'
      },
      transport: {
        label: 'Space Transport',
        path: '/transports',
        backLabel: 'Back to Transports'
      },
      capital: {
        label: 'Capital Ship',
        path: '/capital-ships',
        backLabel: 'Back to Capital Ships'
      },
      other: {
        label: 'Other Vessel',
        path: '/starships',
        backLabel: 'Back to Starships'
      }
    };

    return categoryMap[category as keyof typeof categoryMap] || categoryMap.other;
  };

  if (error || !starship) {
    return (
      <main className='mx-auto max-w-5xl px-4 py-20 text-center'>
        <div className='card bg-[#101628]/80 border border-red-500/40 text-red-200'>
          <p>{error ?? 'Starship not found.'}</p>
          <button
            type='button'
            className='btn-secondary mt-4'
            onClick={() => navigate('/starships')}
          >
            Back to starships
          </button>
        </div>
      </main>
    );
  }

  const categoryInfo = getCategoryInfo(starship.category);

  // Build image path matching species pattern
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  const imageSrc = starship.imageFilename
    ? `${normalizedBase}images/starships/${starship.imageFilename.replace(/^\/+/,'')}`
    : starship.imageUrl || '';

  return (
    <main className='mx-auto max-w-5xl px-4 py-12 text-gray-100'>
      <button
        type='button'
        className='btn-ghost mb-6'
        onClick={() => navigate(categoryInfo.path)}
      >
        ← {categoryInfo.backLabel}
      </button>

      <section className='card grid gap-8 border border-yellow-500/30 bg-[#101628]/80 shadow-[0_0_35px_rgba(255,213,79,0.08)] sm:grid-cols-[320px_1fr]'>
        <div className='flex flex-col items-center gap-6'>
          {/* Image */}
          <div className='flex h-[360px] w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-yellow-400/30 bg-[#11172c] p-4 shadow-[0_0_30px_rgba(255,213,79,0.12)]'>
            {!imageFailed && imageSrc ? (
              <img
                src={imageSrc}
                alt={starship.name}
                className='h-full w-full object-contain'
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className='text-center text-gray-500'>
                <p className='text-sm'>No image available</p>
              </div>
            )}
          </div>

          {/* Title and Category */}
          <div className='text-center'>
            <h1 className='text-4xl font-heading text-yellow-200 drop-shadow-[0_0_20px_rgba(255,213,79,0.3)]'>
              {starship.name}
            </h1>
            <p className='mt-2 text-sm uppercase tracking-[0.35em] text-yellow-400/70'>
              {categoryInfo.label}
            </p>
            {starship.isVariant && starship.parent && (
              <p className='mt-2 text-sm text-yellow-400/60'>
                Variant of {starship.parent.replace(/'''/g, '')}
              </p>
            )}
          </div>
        </div>

        <div className='space-y-6'>
          {/* Craft/Description */}
          {starship.craft && (
            <p className='text-gray-200/90'>{starship.craft}</p>
          )}
          {starship.description && (
            <p className='text-gray-200/90'>{starship.description}</p>
          )}

          {/* Basic Info */}
          <div>
            <h2 className='text-lg font-heading text-yellow-200 mb-3'>Vessel Specifications</h2>
            <div className='grid sm:grid-cols-2 gap-3 text-sm'>
              {starship.affiliation && (
                <div>
                  <span className='text-gray-400'>Affiliation:</span>
                  <p className='text-gray-100'>{starship.affiliation}</p>
                </div>
              )}
              {starship.type && (
                <div>
                  <span className='text-gray-400'>Type:</span>
                  <p className='text-gray-100'>{starship.type}</p>
                </div>
              )}
              {starship.scale && (
                <div>
                  <span className='text-gray-400'>Scale:</span>
                  <p className='text-gray-100'>{starship.scale}</p>
                </div>
              )}
              {starship.length && (
                <div>
                  <span className='text-gray-400'>Length:</span>
                  <p className='text-gray-100'>{starship.length}</p>
                </div>
              )}
              {starship.cost && (
                <div>
                  <span className='text-gray-400'>Cost:</span>
                  <p className='text-gray-100'>{starship.cost}</p>
                </div>
              )}
            </div>
          </div>

          {/* Crew & Capacity */}
          <div>
            <h2 className='text-lg font-heading text-yellow-200 mb-3'>Crew & Capacity</h2>
            <div className='grid sm:grid-cols-2 gap-3 text-sm'>
              {starship.crew && (
                <div>
                  <span className='text-gray-400'>Crew:</span>
                  <p className='text-gray-100'>{starship.crew}</p>
                </div>
              )}
              {starship.crewSkill && (
                <div>
                  <span className='text-gray-400'>Crew Skill:</span>
                  <p className='text-gray-100'>{starship.crewSkill}</p>
                </div>
              )}
              {starship.passengers && (
                <div>
                  <span className='text-gray-400'>Passengers:</span>
                  <p className='text-gray-100'>{starship.passengers}</p>
                </div>
              )}
              {starship.cargoCapacity && (
                <div>
                  <span className='text-gray-400'>Cargo Capacity:</span>
                  <p className='text-gray-100'>{starship.cargoCapacity}</p>
                </div>
              )}
              {starship.consumables && (
                <div>
                  <span className='text-gray-400'>Consumables:</span>
                  <p className='text-gray-100'>{starship.consumables}</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance */}
          <div>
            <h2 className='text-lg font-heading text-yellow-200 mb-3'>Performance Characteristics</h2>
            <div className='grid sm:grid-cols-2 gap-3 text-sm'>
              {starship.skill && (
                <div>
                  <span className='text-gray-400'>Required Skill:</span>
                  <p className='text-gray-100'>{starship.skill}</p>
                </div>
              )}
              {starship.hyperdrive && (
                <div>
                  <span className='text-gray-400'>Hyperdrive:</span>
                  <p className='text-gray-100'>{starship.hyperdrive}</p>
                </div>
              )}
              {starship.navComputer && (
                <div>
                  <span className='text-gray-400'>Nav Computer:</span>
                  <p className='text-gray-100'>{starship.navComputer}</p>
                </div>
              )}
              {starship.maneuverability && (
                <div>
                  <span className='text-gray-400'>Maneuverability:</span>
                  <p className='text-gray-100'>{starship.maneuverability}</p>
                </div>
              )}
              {starship.space && (
                <div>
                  <span className='text-gray-400'>Space Speed:</span>
                  <p className='text-gray-100'>{starship.space}</p>
                </div>
              )}
              {starship.atmosphere && (
                <div>
                  <span className='text-gray-400'>Atmosphere Speed:</span>
                  <p className='text-gray-100'>{starship.atmosphere}</p>
                </div>
              )}
              {starship.hull && (
                <div>
                  <span className='text-gray-400'>Hull:</span>
                  <p className='text-gray-100'>{starship.hull}</p>
                </div>
              )}
              {starship.shields && (
                <div>
                  <span className='text-gray-400'>Shields:</span>
                  <p className='text-gray-100'>{starship.shields}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sensors */}
          {starship.sensors && Object.keys(starship.sensors).length > 0 && (
            <div>
              <h2 className='text-lg font-heading text-yellow-200 mb-3'>Sensor Systems</h2>
              <div className='grid sm:grid-cols-2 gap-3 text-sm'>
                {starship.sensors.passive && (
                  <div>
                    <span className='text-gray-400'>Passive:</span>
                    <p className='text-gray-100'>{starship.sensors.passive}</p>
                  </div>
                )}
                {starship.sensors.scan && (
                  <div>
                    <span className='text-gray-400'>Scan:</span>
                    <p className='text-gray-100'>{starship.sensors.scan}</p>
                  </div>
                )}
                {starship.sensors.search && (
                  <div>
                    <span className='text-gray-400'>Search:</span>
                    <p className='text-gray-100'>{starship.sensors.search}</p>
                  </div>
                )}
                {starship.sensors.focus && (
                  <div>
                    <span className='text-gray-400'>Focus:</span>
                    <p className='text-gray-100'>{starship.sensors.focus}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Weapons */}
          {starship.weapons && starship.weapons.length > 0 && (
            <div>
              <h2 className='text-lg font-heading text-yellow-200 mb-3'>Weapons</h2>
              <div className='space-y-4'>
                {starship.weapons.map((weapon, idx) => (
                  <div key={idx} className='border-l-2 border-yellow-400/30 pl-3'>
                    <h3 className='font-medium text-gray-100'>{weapon.name}</h3>
                    <div className='mt-1 grid sm:grid-cols-2 gap-2 text-sm'>
                      {weapon.fireArc && (
                        <div>
                          <span className='text-gray-400'>Fire Arc:</span>{' '}
                          <span className='text-gray-200'>{weapon.fireArc}</span>
                        </div>
                      )}
                      {weapon.scale && (
                        <div>
                          <span className='text-gray-400'>Scale:</span>{' '}
                          <span className='text-gray-200'>{weapon.scale}</span>
                        </div>
                      )}
                      {weapon.skill && (
                        <div>
                          <span className='text-gray-400'>Skill:</span>{' '}
                          <span className='text-gray-200'>{weapon.skill}</span>
                        </div>
                      )}
                      {weapon.fireControl && (
                        <div>
                          <span className='text-gray-400'>Fire Control:</span>{' '}
                          <span className='text-gray-200'>{weapon.fireControl}</span>
                        </div>
                      )}
                      {weapon.spaceRange && (
                        <div>
                          <span className='text-gray-400'>Space Range:</span>{' '}
                          <span className='text-gray-200'>{weapon.spaceRange}</span>
                        </div>
                      )}
                      {weapon.atmosphereRange && (
                        <div>
                          <span className='text-gray-400'>Atmosphere Range:</span>{' '}
                          <span className='text-gray-200'>{weapon.atmosphereRange}</span>
                        </div>
                      )}
                      {weapon.damage && (
                        <div>
                          <span className='text-gray-400'>Damage:</span>{' '}
                          <span className='text-gray-200'>{weapon.damage}</span>
                        </div>
                      )}
                      {weapon.ammo && (
                        <div>
                          <span className='text-gray-400'>Ammo:</span>{' '}
                          <span className='text-gray-200'>{weapon.ammo}</span>
                        </div>
                      )}
                    </div>
                    {weapon.description && (
                      <p className='mt-1 text-sm text-gray-300'>{weapon.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {starship.notes && (
            <div>
              <h2 className='text-lg font-heading text-yellow-200 mb-3'>Additional Information</h2>
              <p className='text-sm text-gray-200/80 whitespace-pre-line'>{starship.notes}</p>
            </div>
          )}

          {/* Sources */}
          {starship.sources?.length > 0 && (
            <div>
              <h2 className='text-lg font-heading text-yellow-200'>Sources</h2>
              <ul className='mt-2 list-disc space-y-1 pl-5 text-gray-200/80'>
                {starship.sources.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default StarshipDetailPage;
