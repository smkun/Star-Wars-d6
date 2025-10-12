import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Character } from '@/types/character.types';

export default function CharacterDetail() {
  const { id } = useParams();
  const [char, setChar] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await api.fetchWithAuth(`/characters/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to load character: ${res.status}`);
        }
        const data = await res.json();

        if (mounted) {
          setChar(data);
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load character');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleDelete() {
    if (!confirm(`Delete ${char?.name}? This cannot be undone.`)) return;

    try {
      await api.fetchWithAuth(`/characters/${id}`, { method: 'DELETE' });
      nav('/characters');
    } catch (e) {
      console.error(e);
      alert('Failed to delete character');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-yellow-400 flex items-center justify-center">
        <div className="text-2xl">Loading character...</div>
      </div>
    );
  }

  if (error || !char) {
    return (
      <div className="min-h-screen bg-gray-900 text-yellow-400">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">Character Not Found</h1>
          <p className="text-gray-400 mb-8">{error || 'This character does not exist or you do not have access to it.'}</p>
          <Link to="/characters" className="text-yellow-400 hover:underline">
            ← Back to Characters
          </Link>
        </div>
      </div>
    );
  }

  const data = char.data;

  // Core attributes (always shown)
  const coreAttributes = [
    { key: 'dexterity', label: 'DEXTERITY', data: data?.dexterity },
    { key: 'perception', label: 'PERCEPTION', data: data?.perception },
    { key: 'knowledge', label: 'KNOWLEDGE', data: data?.knowledge },
    { key: 'strength', label: 'STRENGTH', data: data?.strength },
    { key: 'mechanical', label: 'MECHANICAL', data: data?.mechanical },
    { key: 'technical', label: 'TECHNICAL', data: data?.technical },
  ];

  // Force attributes (only when Force Sensitive)
  const forceAttributes = data?.forceSensitive ? [
    { key: 'control', label: 'CONTROL', data: data?.control },
    { key: 'sense', label: 'SENSE', data: data?.sense },
    { key: 'alter', label: 'ALTER', data: data?.alter },
  ] : [];

  const allAttributes = [...coreAttributes, ...forceAttributes];

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-400">
      {/* Header */}
      <header className="border-b-2 border-yellow-400 bg-gray-950">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Link
            to="/characters"
            className="mb-4 text-sm text-yellow-400/80 hover:text-yellow-400 transition-colors block"
          >
            ← Back to Characters
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-bold mb-2">{char.name}</h1>
              <div className="text-xl text-gray-400 space-y-1">
                <div>{data?.type || 'Character'} • {data?.species || char.species_slug}</div>
                {data?.homeworld && <div>{data.homeworld}</div>}
                {(data?.gender || data?.age || data?.height || data?.weight) && (
                  <div className="text-sm">
                    {data.gender && `${data.gender}`}
                    {data.age && ` • Age ${data.age}`}
                    {data.height && ` • ${data.height}`}
                    {data.weight && ` • ${data.weight}`}
                  </div>
                )}
                {data?.move && <div className="text-sm">Move: {data.move}</div>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Link
            to={`/characters/${id}/edit`}
            className="bg-yellow-400 text-gray-900 px-6 py-2 rounded font-semibold hover:bg-yellow-300 transition-colors"
          >
            Edit Character
          </Link>
          <Link
            to={`/characters/${id}/print`}
            target="_blank"
            className="bg-gray-700 text-yellow-400 px-6 py-2 rounded font-semibold hover:bg-gray-600 transition-colors"
          >
            Print Sheet
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-900/30 text-red-400 px-6 py-2 rounded font-semibold hover:bg-red-900/50 transition-colors ml-auto"
          >
            Delete
          </button>
        </div>

        {/* Character Info */}
        {(data?.appearance || data?.personality || data?.quote) && (
          <section className="mb-8 space-y-4">
            {data.appearance && (
              <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-4">
                <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-2">Appearance</h3>
                <p className="text-gray-300">{data.appearance}</p>
              </div>
            )}
            {data.personality && (
              <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-4">
                <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-2">Personality</h3>
                <p className="text-gray-300">{data.personality}</p>
              </div>
            )}
            {data.quote && (
              <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-4">
                <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-2">A Quote</h3>
                <p className="text-yellow-400 italic">"{data.quote}"</p>
              </div>
            )}
          </section>
        )}

        {/* Attributes & Skills Grid (d6 character sheet layout) */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">Attributes & Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allAttributes.map((attr) => (
              <div
                key={attr.key}
                className="bg-gray-800 border-2 border-yellow-400/20 rounded p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wide">
                    {attr.label}:
                  </h3>
                  <div className="text-2xl font-bold text-yellow-400">
                    {attr.data?.dice || '—'}
                  </div>
                </div>
                {attr.data?.skills && attr.data.skills.length > 0 && (
                  <div className="space-y-1 mt-3 pt-3 border-t border-yellow-400/20">
                    {attr.data.skills.map((skill, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-center ${
                          skill.isSpecialization ? 'pl-4 text-sm' : ''
                        }`}
                      >
                        <span className="text-gray-300">
                          {skill.isSpecialization && '└ '}
                          {skill.name}
                        </span>
                        <span className="text-yellow-400 font-mono">{skill.dice}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Combat & Equipment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Weapons */}
          {data?.weapons && (Array.isArray(data.weapons) && data.weapons.length > 0) && (
            <div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Weapons</h3>
              <div className="space-y-4">
                {data.weapons.map((weapon, idx) => {
                  // Handle string format from Thursday characters
                  if (typeof weapon === 'string') {
                    return (
                      <div key={idx} className="bg-gray-800 border-2 border-yellow-400/20 rounded p-4">
                        <p className="text-yellow-400">{weapon}</p>
                      </div>
                    );
                  }
                  // Handle object format from character form
                  return (
                  <div key={idx} className="bg-gray-800 border-2 border-yellow-400/20 rounded p-4">
                    <h4 className="text-lg font-bold text-yellow-400 mb-3">{weapon.name}</h4>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {weapon.skill && (
                        <div>
                          <span className="text-xs text-gray-400 block">Skill</span>
                          <span className="text-yellow-400">{weapon.skill}</span>
                        </div>
                      )}
                      {weapon.damage && (
                        <div>
                          <span className="text-xs text-gray-400 block">Damage</span>
                          <span className="text-yellow-400 font-mono">{weapon.damage}</span>
                        </div>
                      )}
                      {weapon.range && (
                        <div>
                          <span className="text-xs text-gray-400 block">Range</span>
                          <span className="text-yellow-400 font-mono text-sm">{weapon.range}</span>
                        </div>
                      )}
                      {weapon.ammo !== undefined && (
                        <div>
                          <span className="text-xs text-gray-400 block">Ammo</span>
                          <span className="text-yellow-400 font-mono">{weapon.ammo}</span>
                        </div>
                      )}
                      {weapon.fireRate !== undefined && (
                        <div>
                          <span className="text-xs text-gray-400 block">Fire Rate</span>
                          <span className="text-yellow-400 font-mono">{weapon.fireRate}</span>
                        </div>
                      )}
                      {weapon.cost !== undefined && (
                        <div>
                          <span className="text-xs text-gray-400 block">Cost</span>
                          <span className="text-yellow-400 font-mono">{weapon.cost} cr</span>
                        </div>
                      )}
                      {weapon.ammoCost !== undefined && (
                        <div>
                          <span className="text-xs text-gray-400 block">Ammo Cost</span>
                          <span className="text-yellow-400 font-mono">{weapon.ammoCost} cr</span>
                        </div>
                      )}
                    </div>

                    {weapon.notes && (
                      <div className="pt-3 border-t border-yellow-400/20">
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{weapon.notes}</p>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Armor */}
          {data?.armor && (
            <div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Armor</h3>
              <div className="space-y-4">
                {/* Handle string format from Thursday characters */}
                {typeof data.armor === 'string' ? (
                  <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-4">
                    <p className="text-yellow-400">{data.armor}</p>
                  </div>
                ) : Array.isArray(data.armor) && data.armor.length > 0 ? (
                  data.armor.map((armor, idx) => (
                  <div key={idx} className="bg-gray-800 border-2 border-yellow-400/20 rounded p-4">
                    <h4 className="text-lg font-bold text-yellow-400 mb-3">{armor.name}</h4>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-xs text-gray-400 block">Protection (P)</span>
                        <span className="text-yellow-400 font-mono">{armor.protectionPhysical || '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block">Protection (E)</span>
                        <span className="text-yellow-400 font-mono">{armor.protectionEnergy || '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block">STR Bonus</span>
                        <span className="text-yellow-400 font-mono">{armor.strBonus || '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block">DEX Penalty</span>
                        <span className="text-yellow-400 font-mono">{armor.dexPenalty || '—'}</span>
                      </div>
                      {armor.cost !== undefined && (
                        <div>
                          <span className="text-xs text-gray-400 block">Cost</span>
                          <span className="text-yellow-400 font-mono">{armor.cost} cr</span>
                        </div>
                      )}
                    </div>

                    {armor.locations && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-400 block mb-1">Protects:</span>
                        <div className="flex gap-2 flex-wrap">
                          {armor.locations.head && <span className="px-2 py-1 bg-gray-900 border border-yellow-400/30 rounded text-xs text-yellow-400">Head</span>}
                          {armor.locations.torso && <span className="px-2 py-1 bg-gray-900 border border-yellow-400/30 rounded text-xs text-yellow-400">Torso</span>}
                          {armor.locations.arms && <span className="px-2 py-1 bg-gray-900 border border-yellow-400/30 rounded text-xs text-yellow-400">Arms</span>}
                          {armor.locations.legs && <span className="px-2 py-1 bg-gray-900 border border-yellow-400/30 rounded text-xs text-yellow-400">Legs</span>}
                        </div>
                      </div>
                    )}

                    {armor.notes && (
                      <div className="pt-3 border-t border-yellow-400/20">
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{armor.notes}</p>
                      </div>
                    )}
                  </div>
                  ))
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Equipment & Credits */}
        {((data?.equipment && data.equipment.length > 0) || data?.credits !== undefined) && (
          <section className="mb-12">
            <h3 className="text-2xl font-bold mb-4 text-yellow-400">Equipment</h3>
            <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
              {data.equipment && data.equipment.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {data.equipment
                    .filter((item) => {
                      // Only show items with non-empty names
                      const name = typeof item === 'string' ? item : item.name;
                      return name && name.trim().length > 0;
                    })
                    .map((item, idx) => {
                      // Handle both old string format and new object format
                      const name = typeof item === 'string' ? item : item.name;
                      const cost = typeof item === 'string' ? undefined : item.cost;

                      return (
                        <li key={idx} className="text-gray-300 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400">•</span>
                            <span>{name}</span>
                          </div>
                          {cost !== undefined && (
                            <span className="text-yellow-400 font-mono">{cost} cr</span>
                          )}
                        </li>
                      );
                    })}
                </ul>
              )}
              {data.credits !== undefined && (
                <div className="text-yellow-400 font-bold pt-4 border-t border-yellow-400/20">
                  Credits: {data.credits}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Special Abilities & Force */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Special Abilities */}
          {data?.specialAbilities && data.specialAbilities.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Special Abilities</h3>
              <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
                <ul className="space-y-2">
                  {data.specialAbilities.map((ability, idx) => (
                    <li key={idx} className="text-gray-300">{ability}</li>
                  ))}
                </ul>
                {data.characterPoints !== undefined && (
                  <div className="mt-4 pt-4 border-t border-yellow-400/20 text-yellow-400">
                    Character Points: <span className="font-bold">{data.characterPoints}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* The Force */}
          {(data?.forceSensitive || data?.forcePoints !== undefined) && (
            <div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">The Force</h3>
              <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Force Sensitive?</span>
                  <span className="text-yellow-400">{data.forceSensitive ? 'Yes' : 'No'}</span>
                </div>
                {data.forcePoints !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Force Points</span>
                    <span className="text-yellow-400 font-bold">{data.forcePoints}</span>
                  </div>
                )}
                {data.darkSidePoints !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dark Side Points</span>
                    <span className="text-red-400 font-bold">{data.darkSidePoints}</span>
                  </div>
                )}
                {(data.control || data.sense || data.alter) && (
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-yellow-400/20">
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Control</div>
                      <div className="text-yellow-400 font-mono">{data.control?.dice || '—'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Sense</div>
                      <div className="text-yellow-400 font-mono">{data.sense?.dice || '—'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Alter</div>
                      <div className="text-yellow-400 font-mono">{data.alter?.dice || '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SRP Tracking */}
        {data?.srp && (data.srp.s || data.srp.r || data.srp.p) && (
          <section className="mb-12">
            <h3 className="text-2xl font-bold mb-4 text-yellow-400">SRP Tracking</h3>
            <p className="text-sm text-gray-400 mb-4">
              S = Surprised (3×PER), R = Readied (3×DEX), P = Psyche (3×KNO)
            </p>
            <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400 uppercase mb-2">Surprised (S)</div>
                  <div className="text-3xl font-bold text-yellow-400">{data.srp.s ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">3×PER</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 uppercase mb-2">Readied (R)</div>
                  <div className="text-3xl font-bold text-yellow-400">{data.srp.r ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">3×DEX</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 uppercase mb-2">Psyche (P)</div>
                  <div className="text-3xl font-bold text-yellow-400">{data.srp.p ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">3×KNO</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Background */}
        {data?.background && (
          <section className="mb-12">
            <h3 className="text-2xl font-bold mb-4 text-yellow-400">Background</h3>
            <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
              <p className="text-gray-300 whitespace-pre-wrap">{data.background}</p>
            </div>
          </section>
        )}

        {/* Edges and Complications */}
        {data?.edgesAndComplications && (
          <section className="mb-12">
            <h3 className="text-2xl font-bold mb-4 text-yellow-400">Edges and Complications</h3>
            <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
              <p className="text-gray-300 whitespace-pre-wrap">{data.edgesAndComplications}</p>
            </div>
          </section>
        )}

        {/* Notes */}
        {data?.notes && (
          <section className="mb-12">
            <h3 className="text-2xl font-bold mb-4 text-yellow-400">Notes</h3>
            <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
              <p className="text-gray-300 whitespace-pre-wrap">{data.notes}</p>
            </div>
          </section>
        )}

        {/* Debug Data (dev mode only) */}
        {import.meta.env.DEV && (
          <details className="mt-12 bg-gray-800/50 border border-yellow-400/10 rounded p-4">
            <summary className="cursor-pointer text-gray-500 text-sm">
              Debug: Raw Character Data
            </summary>
            <pre className="mt-4 text-xs text-gray-600 overflow-auto">
              {JSON.stringify(char, null, 2)}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}
