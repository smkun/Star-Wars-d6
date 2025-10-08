import { useEffect, useState } from 'react';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

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
}

export default function Starships() {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStarships = async () => {
      try {
        const db = getFirestore();
        const snapshot = await getDocs(collection(db, 'starships'));

        const ships = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Starship));

        setStarships(ships);
      } catch (error) {
        console.error('Error fetching starships:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStarships();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-yellow-400 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Loading Starships...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-400 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 border-b-2 border-yellow-400 pb-4">
          Star Wars d6 Starships
        </h1>

        <div className="mb-4 text-gray-400">
          Found {starships.length} starships
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {starships.map((ship) => (
            <div
              key={ship.id}
              className="bg-gray-800 border border-yellow-400/30 rounded-lg p-6 hover:border-yellow-400 transition-colors"
            >
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                {ship.name}
              </h2>

              {ship.craft && (
                <p className="text-sm text-gray-400 mb-4">{ship.craft}</p>
              )}

              <div className="space-y-2 text-sm">
                {ship.affiliation && (
                  <div>
                    <span className="text-gray-500">Affiliation:</span>{' '}
                    <span className="text-gray-300">{ship.affiliation}</span>
                  </div>
                )}

                {ship.type && (
                  <div>
                    <span className="text-gray-500">Type:</span>{' '}
                    <span className="text-gray-300">{ship.type}</span>
                  </div>
                )}

                {ship.scale && (
                  <div>
                    <span className="text-gray-500">Scale:</span>{' '}
                    <span className="text-gray-300">{ship.scale}</span>
                  </div>
                )}

                {ship.length && (
                  <div>
                    <span className="text-gray-500">Length:</span>{' '}
                    <span className="text-gray-300">{ship.length}</span>
                  </div>
                )}

                {ship.crew && (
                  <div>
                    <span className="text-gray-500">Crew:</span>{' '}
                    <span className="text-gray-300">{ship.crew}</span>
                  </div>
                )}

                {ship.hyperdrive && (
                  <div>
                    <span className="text-gray-500">Hyperdrive:</span>{' '}
                    <span className="text-gray-300">{ship.hyperdrive}</span>
                  </div>
                )}

                {ship.maneuverability && (
                  <div>
                    <span className="text-gray-500">Maneuverability:</span>{' '}
                    <span className="text-gray-300">{ship.maneuverability}</span>
                  </div>
                )}

                {ship.space && (
                  <div>
                    <span className="text-gray-500">Space:</span>{' '}
                    <span className="text-gray-300">{ship.space}</span>
                  </div>
                )}

                {ship.hull && (
                  <div>
                    <span className="text-gray-500">Hull:</span>{' '}
                    <span className="text-gray-300">{ship.hull}</span>
                  </div>
                )}

                {ship.shields && (
                  <div>
                    <span className="text-gray-500">Shields:</span>{' '}
                    <span className="text-gray-300">{ship.shields}</span>
                  </div>
                )}

                {ship.weapons.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-gray-500 mb-2">Weapons:</div>
                    {ship.weapons.map((weapon, idx) => (
                      <div key={idx} className="ml-2 mb-2">
                        <div className="text-gray-300">{weapon.name}</div>
                        {weapon.damage && (
                          <div className="text-xs text-gray-500">
                            Damage: {weapon.damage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
