import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { useParams } from 'react-router-dom';
import type { Character, CharacterData, AttributeBlock } from '@/types/character.types';

export default function CharacterPrint() {
  const { id } = useParams();
  const [char, setChar] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await api.fetchWithAuth(`/characters/${id}`);
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        const data = await res.json();
        if (mounted) setChar(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    // Hide print button and trigger print dialog after load
    if (char && !loading) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [char, loading]);

  if (loading || !char) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-2xl text-gray-900">Loading character sheet...</div>
      </div>
    );
  }

  const data: CharacterData = char.data || {};

  // Helper functions to check if sections have content
  const hasWeapons = data.weapons && data.weapons.length > 0;
  const hasArmor = data.armor && data.armor.length > 0;
  const hasEquipment = data.equipment && data.equipment.length > 0;
  const hasSpecialAbilities = data.specialAbilities && data.specialAbilities.length > 0;
  const hasBackground = data.background && data.background.trim().length > 0;
  const hasSRP = data.srp && (data.srp.s || data.srp.r || data.srp.p);
  const hasForceAttributes = data.forceSensitive && (
    (data.control as AttributeBlock)?.dice ||
    (data.sense as AttributeBlock)?.dice ||
    (data.alter as AttributeBlock)?.dice
  );

  function renderAttribute(attrKey: keyof CharacterData) {
    const attr = data[attrKey] as AttributeBlock | undefined;
    if (!attr) return null;
    return (
      <div>
        <div className="font-bold text-sm mb-1">{attr.dice || '___'}</div>
        {attr.skills?.map((skill, idx) => (
          <div key={idx} className="text-xs flex justify-between border-b border-gray-300 py-0.5">
            <span className={skill.isSpecialization ? 'pl-2 italic' : ''}>
              {skill.name || '_______________'}
            </span>
            <span className="font-mono">{skill.dice || '___'}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .bottom-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
        @media screen {
          .print-container {
            max-width: 8.5in;
            margin: 0 auto;
            background: white;
            padding: 0.5in;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* Screen-only print button */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded shadow-lg hover:bg-yellow-300"
        >
          Print Character Sheet
        </button>
      </div>

      <div className="print-container bg-white text-gray-900 min-h-screen">
        {/* Star Wars Header */}
        <div className="bg-gray-900 text-white text-center py-3 mb-4 rounded">
          <div className="text-3xl font-bold tracking-widest" style={{ fontFamily: 'sans-serif', letterSpacing: '0.2em' }}>
            STAR WARS
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Left Column - Character Info & Attributes */}
          <div className="col-span-2 space-y-4">
            {/* Basic Info */}
            <div className="border-2 border-gray-900 rounded p-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <span className="font-bold">NAME: </span>
                  <span className="border-b border-gray-400">{char.name}</span>
                </div>
                <div>
                  <span className="font-bold">TYPE: </span>
                  <span className="border-b border-gray-400">{data.type || '___________'}</span>
                </div>
                <div>
                  <span className="font-bold">Species: </span>
                  <span className="border-b border-gray-400">{data.species || '___________'}</span>
                </div>
                <div>
                  <span className="font-bold">Homeworld: </span>
                  <span className="border-b border-gray-400">{data.homeworld || '___________'}</span>
                </div>
                <div>
                  <span className="font-bold">Gender: </span>
                  <span className="border-b border-gray-400">{data.gender || '______'}</span>
                </div>
                <div>
                  <span className="font-bold">Age: </span>
                  <span className="border-b border-gray-400">{data.age || '___'}</span>
                </div>
                <div>
                  <span className="font-bold">Height: </span>
                  <span className="border-b border-gray-400">{data.height || '______'}</span>
                </div>
                <div>
                  <span className="font-bold">Weight: </span>
                  <span className="border-b border-gray-400">{data.weight || '______'}</span>
                </div>
              </div>
              {data.appearance && (
                <div className="mt-2">
                  <span className="font-bold">Appearance: </span>
                  <div className="border-b border-gray-400 text-xs min-h-[2rem]">{data.appearance}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-4 mt-2">
                <div>
                  <span className="font-bold">Move: </span>
                  <span className="border-b border-gray-400">{data.move || '10'}</span>
                </div>
              </div>
              {data.personality && (
                <div className="mt-2">
                  <span className="font-bold">Personality: </span>
                  <div className="border-b border-gray-400 text-xs min-h-[2rem]">{data.personality}</div>
                </div>
              )}
              {data.quote && (
                <div className="mt-2">
                  <span className="font-bold">A Quote: </span>
                  <div className="border-b border-gray-400 text-xs min-h-[1.5rem] italic">{data.quote}</div>
                </div>
              )}
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Attributes */}
              <div className="space-y-3">
                <div className="border-2 border-gray-900 rounded p-2">
                  <div className="font-bold text-base mb-1">DEXTERITY:</div>
                  {renderAttribute('dexterity')}
                </div>
                <div className="border-2 border-gray-900 rounded p-2">
                  <div className="font-bold text-base mb-1">KNOWLEDGE:</div>
                  {renderAttribute('knowledge')}
                </div>
                <div className="border-2 border-gray-900 rounded p-2">
                  <div className="font-bold text-base mb-1">MECHANICAL:</div>
                  {renderAttribute('mechanical')}
                </div>
              </div>

              {/* Right Attributes */}
              <div className="space-y-3">
                <div className="border-2 border-gray-900 rounded p-2">
                  <div className="font-bold text-base mb-1">PERCEPTION:</div>
                  {renderAttribute('perception')}
                </div>
                <div className="border-2 border-gray-900 rounded p-2">
                  <div className="font-bold text-base mb-1">STRENGTH:</div>
                  {renderAttribute('strength')}
                </div>
                <div className="border-2 border-gray-900 rounded p-2">
                  <div className="font-bold text-base mb-1">TECHNICAL:</div>
                  {renderAttribute('technical')}
                </div>
              </div>
            </div>

            {/* Special Abilities & Character Points */}
            {hasSpecialAbilities && (
              <div className="border-2 border-gray-900 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-base">SPECIAL ABILITIES:</span>
                  <span className="text-sm">
                    <span className="font-bold">Character Points: </span>
                    {data.characterPoints || 0}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  {data.specialAbilities.map((ability, idx) => (
                    <div key={idx} className="border-b border-gray-300">{ability}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Equipment & Combat */}
          <div className="space-y-4">
            {/* Character Portrait Placeholder - Hidden on print for now */}
            <div className="border-2 border-gray-900 rounded aspect-square bg-gray-100 flex items-center justify-center no-print">
              <span className="text-gray-400 text-sm">Character Illustration</span>
            </div>

            {/* Weapons */}
            {hasWeapons && (
              <div className="border-2 border-gray-900 rounded p-2">
                <div className="font-bold text-sm mb-1">WEAPONS:</div>
                <div className="text-xs">
                  <div className="flex justify-between font-bold border-b border-gray-900 pb-0.5 mb-1">
                    <span className="flex-1">Name</span>
                    <span className="w-16 text-right">Range</span>
                    <span className="w-12 text-right">Damage</span>
                  </div>
                  {data.weapons.map((weapon, idx) => (
                    <div key={idx} className="flex justify-between border-b border-gray-300 py-0.5">
                      <span className="flex-1 truncate">{weapon.name}</span>
                      <span className="w-16 text-right font-mono text-xs">{weapon.range || '___'}</span>
                      <span className="w-12 text-right font-mono">{weapon.damage || '___'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Armor */}
            {hasArmor && (
              <div className="border-2 border-gray-900 rounded p-2">
                <div className="font-bold text-sm mb-1">ARMOR:</div>
                <div className="text-xs">
                  <div className="flex justify-between font-bold border-b border-gray-900 pb-0.5 mb-1">
                    <span className="flex-1">Name</span>
                    <span className="w-16 text-right">Str Bonus</span>
                    <span className="w-16 text-right">Dex Penalty</span>
                  </div>
                  {data.armor.map((armor, idx) => (
                    <div key={idx} className="border-b border-gray-300 py-0.5">
                      <div className="flex justify-between">
                        <span className="flex-1 truncate">{armor.name}</span>
                        <span className="w-16 text-right font-mono">{armor.strBonus || '___'}</span>
                        <span className="w-16 text-right font-mono">{armor.dexPenalty || '___'}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        P: {armor.protectionPhysical || '___'} / E: {armor.protectionEnergy || '___'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {hasEquipment && (
              <div className="border-2 border-gray-900 rounded p-2">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-sm">EQUIPMENT:</span>
                  <span className="text-xs">
                    <span className="font-bold">Credits: </span>
                    {data.credits || 0}
                  </span>
                </div>
                <div className="text-xs space-y-0.5">
                  {data.equipment.map((item, idx) => (
                    <div key={idx} className="border-b border-gray-300">
                      {typeof item === 'string' ? item : item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - Background, Force, Health, SRP */}
        <div className="bottom-section mt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Background */}
            {hasBackground && (
              <div className="col-span-2 border-2 border-gray-900 rounded p-3 avoid-break">
                <div className="font-bold text-base mb-2">BACKGROUND:</div>
                <div className="text-xs whitespace-pre-wrap">{data.background}</div>
              </div>
            )}

            {/* Force & Health Side by Side */}
            <div className={`space-y-4 ${!hasBackground ? 'col-start-3' : ''}`}>
              {/* The Force */}
              <div className="bg-gray-700 text-white rounded p-3 avoid-break">
                <div className="font-bold text-center mb-2">THE FORCE</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Force Sensitive?</span>
                  <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
                    {data.forceSensitive ? '✓' : ''}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Force Points</span>
                  <div className="w-12 bg-white text-gray-900 text-center rounded px-2 py-1 font-bold">
                    {data.forcePoints || 0}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dark Side Points</span>
                  <div className="w-12 bg-white text-gray-900 text-center rounded px-2 py-1 font-bold">
                    {data.darkSidePoints || 0}
                  </div>
                </div>
                {hasForceAttributes && (
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
                    <div>
                      <div className="font-bold">Control</div>
                      <div className="bg-white text-gray-900 rounded px-1 py-1 mt-1 font-mono">
                        {(data.control as AttributeBlock)?.dice || '___'}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">Sense</div>
                      <div className="bg-white text-gray-900 rounded px-1 py-1 mt-1 font-mono">
                        {(data.sense as AttributeBlock)?.dice || '___'}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">Alter</div>
                      <div className="bg-white text-gray-900 rounded px-1 py-1 mt-1 font-mono">
                        {(data.alter as AttributeBlock)?.dice || '___'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

              {/* Health / Wounds */}
              <div className="bg-gray-800 text-white rounded p-3 avoid-break">
                <div className="font-bold text-center mb-2">HEALTH</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Stunned:</span>
                  <div className="w-6 h-6 border-2 border-white rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Wounded:</span>
                  <div className="w-6 h-6 border-2 border-white rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Incapacitated:</span>
                  <div className="w-6 h-6 border-2 border-white rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mortally Wounded:</span>
                  <div className="w-6 h-6 border-2 border-white rounded"></div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* SRP Tracking Section */}
          {hasSRP && (
            <div className="border-2 border-gray-900 rounded p-3 mt-4 avoid-break">
            <div className="font-bold text-base mb-2">SRP TRACKING</div>
            <div className="text-xs text-gray-600 mb-2">
              S = Surprised (3×PER), R = Readied (3×DEX), P = Psyche (3×KNO)
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="font-bold">Surprised (S)</div>
                <div className="text-2xl font-mono mt-1">{data.srp.s || '___'}</div>
              </div>
              <div className="text-center">
                <div className="font-bold">Readied (R)</div>
                <div className="text-2xl font-mono mt-1">{data.srp.r || '___'}</div>
              </div>
              <div className="text-center">
                <div className="font-bold">Psyche (P)</div>
                <div className="text-2xl font-mono mt-1">{data.srp.p || '___'}</div>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Dice Code Scale */}
        <div className="mt-4 bg-gray-900 text-white rounded px-3 py-2 avoid-break">
          <div className="text-xs font-bold mb-1">Dice Code Scale</div>
          <div className="flex flex-wrap gap-1 text-xs">
            {['1D', '1D+1', '1D+2', '2D', '2D+1', '2D+2', '3D', '3D+1', '3D+2', '4D', '4D+1', '4D+2',
              '5D', '5D+1', '5D+2', '6D', '6D+1', '6D+2', '7D', '7D+1', '7D+2', '8D', '8D+1', '8D+2',
              '9D', '9D+1', '9D+2', '10D', '10D+1', '10D+2'].map((code) => (
              <span key={code} className="border border-gray-600 px-2 py-0.5 rounded">{code}</span>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
