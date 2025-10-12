import { useState } from 'react';
import api from '@/utils/api';
import { Link, useNavigate } from 'react-router-dom';
import type { CharacterData, AttributeBlock, Skill } from '@/types/character.types';

// AttributeEditor component defined outside to prevent recreation on every render
function AttributeEditor({
  attrKey,
  label,
  data,
  setData,
  updateAttributeDice,
  updateSkill,
  addSkill,
  removeSkill,
}: {
  attrKey: keyof CharacterData;
  label: string;
  data: CharacterData;
  setData: React.Dispatch<React.SetStateAction<CharacterData>>;
  updateAttributeDice: (attrName: keyof CharacterData, dice: string) => void;
  updateSkill: (attrName: keyof CharacterData, index: number, field: keyof Skill, value: any) => void;
  addSkill: (attrName: keyof CharacterData) => void;
  removeSkill: (attrName: keyof CharacterData, index: number) => void;
}) {
  const attr = data[attrKey] as AttributeBlock;
  const dice = attr?.dice || '';
  const skills = attr?.skills || [];

  function addSpecialization(skillIndex: number) {
    const parentSkill = skills[skillIndex];
    setData((prev) => {
      const attr = prev[attrKey] as AttributeBlock;
      if (!attr) return prev;
      const newSkills = [...attr.skills];
      // Insert specialization right after parent skill
      newSkills.splice(skillIndex + 1, 0, {
        name: '',
        dice: parentSkill.dice,
        isSpecialization: true
      });
      return { ...prev, [attrKey]: { ...attr, skills: newSkills } };
    });
  }

  return (
    <div className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-yellow-400">{label}</h3>
        <input
          type="text"
          value={dice}
          onChange={(e) => updateAttributeDice(attrKey, e.target.value)}
          placeholder="e.g., 3D+1"
          className="w-24 bg-gray-900 border border-yellow-400/30 rounded px-3 py-1 text-yellow-400 text-center font-mono focus:outline-none focus:border-yellow-400"
        />
      </div>

      <div className="space-y-2">
        {skills.map((skill, idx) => (
          <div key={`${attrKey}-skill-${idx}`} className="space-y-1">
            <div className="flex items-start gap-2">
              <div className="flex items-center pt-2.5">
                <input
                  type="checkbox"
                  checked={skill.isSpecialization || false}
                  onChange={(e) => updateSkill(attrKey, idx, 'isSpecialization', e.target.checked)}
                  className="w-4 h-4"
                  title="Is specialization?"
                />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateSkill(attrKey, idx, 'name', e.target.value)}
                  placeholder="Skill name"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div className="w-24 flex-shrink-0">
                <input
                  type="text"
                  value={skill.dice}
                  onChange={(e) => updateSkill(attrKey, idx, 'dice', e.target.value)}
                  placeholder="Dice"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 font-mono text-center focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!skill.isSpecialization && (
                  <button
                    type="button"
                    onClick={() => addSpecialization(idx)}
                    className="px-2.5 py-2 bg-blue-900/30 border border-blue-500/30 rounded text-blue-400 hover:bg-blue-900/50 text-xs whitespace-nowrap"
                    title="Add specialization"
                  >
                    +S
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeSkill(attrKey, idx)}
                  className="px-3 py-2 bg-red-900/30 border border-red-500/30 rounded text-red-400 hover:bg-red-900/50 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addSkill(attrKey)}
          className="w-full px-3 py-2 bg-gray-900 border border-yellow-400/30 rounded text-yellow-400 hover:bg-gray-800"
        >
          + Add Skill
        </button>
      </div>
    </div>
  );
}

export default function CharacterNew() {
  const [name, setName] = useState('');
  const [data, setData] = useState<CharacterData>({});
  const [saving, setSaving] = useState(false);

  const nav = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a character name');
      return;
    }

    setSaving(true);

    try {
      const res = await api.fetchWithAuth('/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          species_slug: data.species || 'human',
          data,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create: ${res.status}`);
      }

      const created = await res.json();
      nav(`/characters/${created.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create character');
      setSaving(false);
    }
  }

  function updateData(field: keyof CharacterData, value: any) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function updateAttributeDice(attrName: keyof CharacterData, dice: string) {
    setData((prev) => ({
      ...prev,
      [attrName]: {
        dice,
        skills: (prev[attrName] as AttributeBlock)?.skills || []
      } as AttributeBlock,
    }));
  }

  function updateSkill(attrName: keyof CharacterData, index: number, field: keyof Skill, value: any) {
    setData((prev) => {
      const attr = prev[attrName] as AttributeBlock;
      if (!attr) return prev;
      const skills = [...attr.skills];
      skills[index] = { ...skills[index], [field]: value };
      return { ...prev, [attrName]: { ...attr, skills } };
    });
  }

  function addSkill(attrName: keyof CharacterData) {
    setData((prev) => {
      const attr = prev[attrName] as AttributeBlock;
      if (!attr) return prev;
      const skills = [...attr.skills, { name: '', dice: '', isSpecialization: false }];
      return { ...prev, [attrName]: { ...attr, skills } };
    });
  }

  function removeSkill(attrName: keyof CharacterData, index: number) {
    setData((prev) => {
      const attr = prev[attrName] as AttributeBlock;
      if (!attr) return prev;
      const skills = attr.skills.filter((_, i) => i !== index);
      return { ...prev, [attrName]: { ...attr, skills } };
    });
  }

  function addWeapon() {
    setData((prev) => ({
      ...prev,
      weapons: [...(prev.weapons || []), {
        name: '',
        skill: '',
        damage: '',
        range: '',
        ammo: undefined,
        fireRate: undefined,
        cost: undefined,
        ammoCost: undefined,
        notes: ''
      }],
    }));
  }

  function updateWeapon(index: number, field: string, value: any) {
    setData((prev) => {
      const weapons = [...(prev.weapons || [])];
      weapons[index] = { ...weapons[index], [field]: value };
      return { ...prev, weapons };
    });
  }

  function removeWeapon(index: number) {
    setData((prev) => ({
      ...prev,
      weapons: prev.weapons?.filter((_, i) => i !== index),
    }));
  }

  function addArmor() {
    setData((prev) => ({
      ...prev,
      armor: [...(prev.armor || []), {
        name: '',
        protectionPhysical: '',
        protectionEnergy: '',
        locations: { head: false, torso: false, arms: false, legs: false },
        strBonus: '',
        dexPenalty: '',
        cost: undefined,
        notes: ''
      }],
    }));
  }

  function updateArmor(index: number, field: string, value: any) {
    setData((prev) => {
      const armor = [...(prev.armor || [])];
      armor[index] = { ...armor[index], [field]: value };
      return { ...prev, armor };
    });
  }

  function updateArmorLocation(index: number, location: 'head' | 'torso' | 'arms' | 'legs', checked: boolean) {
    setData((prev) => {
      const armor = [...(prev.armor || [])];
      armor[index] = {
        ...armor[index],
        locations: { ...armor[index].locations, [location]: checked }
      };
      return { ...prev, armor };
    });
  }

  function removeArmor(index: number) {
    setData((prev) => ({
      ...prev,
      armor: prev.armor?.filter((_, i) => i !== index),
    }));
  }

  function addEquipment() {
    setData((prev) => ({
      ...prev,
      equipment: [...(prev.equipment || []), { name: '', cost: undefined }],
    }));
  }

  function updateEquipmentItem(index: number, field: string, value: any) {
    setData((prev) => {
      const equipment = [...(prev.equipment || [])];
      const currentItem = equipment[index];

      // Convert old string format to object format first
      if (typeof currentItem === 'string') {
        equipment[index] = { name: currentItem, cost: undefined };
      }

      // Now update the field
      equipment[index] = { ...equipment[index], [field]: value };
      return { ...prev, equipment };
    });
  }

  function removeEquipmentItem(index: number) {
    setData((prev) => ({
      ...prev,
      equipment: prev.equipment?.filter((_, i) => i !== index),
    }));
  }

  function addSpecialAbility() {
    setData((prev) => ({
      ...prev,
      specialAbilities: [...(prev.specialAbilities || []), ''],
    }));
  }

  function updateSpecialAbility(index: number, value: string) {
    setData((prev) => {
      const specialAbilities = [...(prev.specialAbilities || [])];
      specialAbilities[index] = value;
      return { ...prev, specialAbilities };
    });
  }

  function removeSpecialAbility(index: number) {
    setData((prev) => ({
      ...prev,
      specialAbilities: prev.specialAbilities?.filter((_, i) => i !== index),
    }));
  }

  const coreAttributes: Array<{ key: keyof CharacterData; label: string }> = [
    { key: 'dexterity', label: 'DEXTERITY' },
    { key: 'knowledge', label: 'KNOWLEDGE' },
    { key: 'mechanical', label: 'MECHANICAL' },
    { key: 'perception', label: 'PERCEPTION' },
    { key: 'strength', label: 'STRENGTH' },
    { key: 'technical', label: 'TECHNICAL' },
  ];

  const forceAttributes: Array<{ key: keyof CharacterData; label: string }> = [
    { key: 'control', label: 'CONTROL' },
    { key: 'sense', label: 'SENSE' },
    { key: 'alter', label: 'ALTER' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-400">
      <header className="border-b-2 border-yellow-400 bg-gray-950">
        <div className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between">
          <div>
            <Link to="/characters" className="text-yellow-400 hover:underline mb-2 block">
              ← Back to Characters
            </Link>
            <h1 className="text-4xl font-bold">Create New Character</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <section className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                <input
                  type="text"
                  value={data.type || ''}
                  onChange={(e) => updateData('type', e.target.value)}
                  placeholder="e.g., Young Jedi, Rebel Saboteur"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Species</label>
                <input
                  type="text"
                  value={data.species || ''}
                  onChange={(e) => updateData('species', e.target.value)}
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Homeworld</label>
                <input
                  type="text"
                  value={data.homeworld || ''}
                  onChange={(e) => updateData('homeworld', e.target.value)}
                  placeholder="e.g., Tatooine, Coruscant"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Gender</label>
                <input
                  type="text"
                  value={data.gender || ''}
                  onChange={(e) => updateData('gender', e.target.value)}
                  placeholder="e.g., Male, Female, Non-binary"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Age</label>
                <input
                  type="text"
                  value={data.age || ''}
                  onChange={(e) => updateData('age', e.target.value)}
                  placeholder="e.g., 25"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Height</label>
                <input
                  type="text"
                  value={data.height || ''}
                  onChange={(e) => updateData('height', e.target.value)}
                  placeholder="e.g., 1.8m, 5'11&quot;"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Weight</label>
                <input
                  type="text"
                  value={data.weight || ''}
                  onChange={(e) => updateData('weight', e.target.value)}
                  placeholder="e.g., 80kg, 175lbs"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Move</label>
                <input
                  type="text"
                  value={data.move || ''}
                  onChange={(e) => updateData('move', e.target.value)}
                  placeholder="e.g., 10"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Credits</label>
                <input
                  type="number"
                  value={data.credits || 0}
                  onChange={(e) => updateData('credits', parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            {/* Character Description */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Appearance</label>
                <textarea
                  value={data.appearance || ''}
                  onChange={(e) => updateData('appearance', e.target.value)}
                  rows={3}
                  placeholder="Physical description, clothing, distinguishing features..."
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Personality</label>
                <textarea
                  value={data.personality || ''}
                  onChange={(e) => updateData('personality', e.target.value)}
                  rows={3}
                  placeholder="Temperament, mannerisms, typical behavior..."
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Quote</label>
                <input
                  type="text"
                  value={data.quote || ''}
                  onChange={(e) => updateData('quote', e.target.value)}
                  placeholder="A characteristic quote or catchphrase..."
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>
          </section>

          {/* Core Attributes */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">Core Attributes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreAttributes.map(({ key, label }) => (
                <AttributeEditor
                  key={key}
                  attrKey={key}
                  label={label}
                  data={data}
                  setData={setData}
                  updateAttributeDice={updateAttributeDice}
                  updateSkill={updateSkill}
                  addSkill={addSkill}
                  removeSkill={removeSkill}
                />
              ))}
            </div>
          </section>

          {/* Force Section */}
          <section className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">The Force</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="forceSensitive"
                  checked={data.forceSensitive || false}
                  onChange={(e) => updateData('forceSensitive', e.target.checked)}
                  className="w-5 h-5 text-yellow-400 bg-gray-900 border-yellow-400/30 rounded focus:ring-yellow-400"
                />
                <label htmlFor="forceSensitive" className="ml-3 text-gray-400">Force Sensitive?</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Force Points</label>
                <input
                  type="number"
                  value={data.forcePoints || 0}
                  onChange={(e) => updateData('forcePoints', parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Dark Side Points</label>
                <input
                  type="number"
                  value={data.darkSidePoints || 0}
                  onChange={(e) => updateData('darkSidePoints', parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Character Points</label>
                <input
                  type="number"
                  value={data.characterPoints || 0}
                  onChange={(e) => updateData('characterPoints', parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            {data.forceSensitive && (
              <>
                <h3 className="text-xl font-bold mb-4 text-yellow-400 mt-6">Force Attributes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {forceAttributes.map(({ key, label }) => (
                    <AttributeEditor
                      key={key}
                      attrKey={key}
                      label={label}
                      data={data}
                      setData={setData}
                      updateAttributeDice={updateAttributeDice}
                      updateSkill={updateSkill}
                      addSkill={addSkill}
                      removeSkill={removeSkill}
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* SRP Tracking */}
          <section className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">SRP Tracking</h2>
            <p className="text-sm text-gray-400 mb-4">
              S = Surprised (3×PER), R = Readied (3×DEX), P = Psyche (3×KNO)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Surprised (S)</label>
                <input
                  type="number"
                  value={data.srp?.s || 0}
                  onChange={(e) => updateData('srp', { ...data.srp, s: parseInt(e.target.value) || 0 })}
                  placeholder="3×PER"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Readied (R)</label>
                <input
                  type="number"
                  value={data.srp?.r || 0}
                  onChange={(e) => updateData('srp', { ...data.srp, r: parseInt(e.target.value) || 0 })}
                  placeholder="3×DEX"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Psyche (P)</label>
                <input
                  type="number"
                  value={data.srp?.p || 0}
                  onChange={(e) => updateData('srp', { ...data.srp, p: parseInt(e.target.value) || 0 })}
                  placeholder="3×KNO"
                  className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>
          </section>

          {/* Weapons */}
          <section className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">Weapons</h2>
            <div className="space-y-6">
              {(data.weapons || []).map((weapon, idx) => (
                <div key={idx} className="bg-gray-900 border border-yellow-400/30 rounded p-4 space-y-3">
                  {/* Weapon Name */}
                  <div className="flex gap-3 items-start">
                    <input
                      type="text"
                      value={weapon.name}
                      onChange={(e) => updateWeapon(idx, 'name', e.target.value)}
                      placeholder="Weapon name (e.g., Blaster Pistol, Lightsaber)"
                      className="flex-1 bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeWeapon(idx)}
                      className="px-3 py-2 bg-red-900/30 border border-red-500/30 rounded text-red-400 hover:bg-red-900/50 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Weapon Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Skill</label>
                      <input
                        type="text"
                        value={weapon.skill || ''}
                        onChange={(e) => updateWeapon(idx, 'skill', e.target.value)}
                        placeholder="e.g., Blaster, Brawling"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Damage</label>
                      <input
                        type="text"
                        value={weapon.damage || ''}
                        onChange={(e) => updateWeapon(idx, 'damage', e.target.value)}
                        placeholder="e.g., 4D"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Range</label>
                      <input
                        type="text"
                        value={weapon.range || ''}
                        onChange={(e) => updateWeapon(idx, 'range', e.target.value)}
                        placeholder="e.g., 3-10/30/120"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Ammo</label>
                      <input
                        type="number"
                        value={weapon.ammo || ''}
                        onChange={(e) => updateWeapon(idx, 'ammo', parseInt(e.target.value) || undefined)}
                        placeholder="e.g., 100"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Fire Rate</label>
                      <input
                        type="number"
                        value={weapon.fireRate || ''}
                        onChange={(e) => updateWeapon(idx, 'fireRate', parseInt(e.target.value) || undefined)}
                        placeholder="e.g., 1 or 3"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Cost (credits)</label>
                      <input
                        type="number"
                        value={weapon.cost || ''}
                        onChange={(e) => updateWeapon(idx, 'cost', parseInt(e.target.value) || undefined)}
                        placeholder="e.g., 500"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Ammo Cost (credits)</label>
                      <input
                        type="number"
                        value={weapon.ammoCost || ''}
                        onChange={(e) => updateWeapon(idx, 'ammoCost', parseInt(e.target.value) || undefined)}
                        placeholder="e.g., 25"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  {/* Weapon Notes */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Notes (special properties, difficulty modifiers, etc.)</label>
                    <textarea
                      value={weapon.notes || ''}
                      onChange={(e) => updateWeapon(idx, 'notes', e.target.value)}
                      rows={2}
                      placeholder="At Long range, increase difficulty by +5."
                      className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400 text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addWeapon}
                className="w-full px-4 py-2 bg-gray-900 border border-yellow-400/30 rounded text-yellow-400 hover:bg-gray-800"
              >
                + Add Weapon
              </button>
            </div>
          </section>

          {/* Armor */}
          <section className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">Armor</h2>
            <div className="space-y-6">
              {(data.armor || []).map((armor, idx) => (
                <div key={idx} className="bg-gray-900 border border-yellow-400/30 rounded p-4 space-y-3">
                  {/* Armor Name */}
                  <div className="flex gap-3 items-start">
                    <input
                      type="text"
                      value={armor.name}
                      onChange={(e) => updateArmor(idx, 'name', e.target.value)}
                      placeholder="Armor name (e.g., Scout Armor)"
                      className="flex-1 bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeArmor(idx)}
                      className="px-3 py-2 bg-red-900/30 border border-red-500/30 rounded text-red-400 hover:bg-red-900/50 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Protection and Bonuses/Penalties */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Physical (P)</label>
                      <input
                        type="text"
                        value={armor.protectionPhysical || ''}
                        onChange={(e) => updateArmor(idx, 'protectionPhysical', e.target.value)}
                        placeholder="e.g., 1D"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Energy (E)</label>
                      <input
                        type="text"
                        value={armor.protectionEnergy || ''}
                        onChange={(e) => updateArmor(idx, 'protectionEnergy', e.target.value)}
                        placeholder="e.g., +1"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">STR Bonus</label>
                      <input
                        type="text"
                        value={armor.strBonus || ''}
                        onChange={(e) => updateArmor(idx, 'strBonus', e.target.value)}
                        placeholder="e.g., +2D"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">DEX Penalty</label>
                      <input
                        type="text"
                        value={armor.dexPenalty || ''}
                        onChange={(e) => updateArmor(idx, 'dexPenalty', e.target.value)}
                        placeholder="e.g., -1D"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Cost (credits)</label>
                      <input
                        type="number"
                        value={armor.cost || ''}
                        onChange={(e) => updateArmor(idx, 'cost', parseInt(e.target.value) || undefined)}
                        placeholder="e.g., 1000"
                        className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  {/* Location Checkboxes */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Protects:</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={armor.locations?.head || false}
                          onChange={(e) => updateArmorLocation(idx, 'head', e.target.checked)}
                          className="w-4 h-4 text-yellow-400 bg-gray-800 border-yellow-400/30 rounded"
                        />
                        <span className="ml-2 text-gray-400">Head</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={armor.locations?.torso || false}
                          onChange={(e) => updateArmorLocation(idx, 'torso', e.target.checked)}
                          className="w-4 h-4 text-yellow-400 bg-gray-800 border-yellow-400/30 rounded"
                        />
                        <span className="ml-2 text-gray-400">Torso</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={armor.locations?.arms || false}
                          onChange={(e) => updateArmorLocation(idx, 'arms', e.target.checked)}
                          className="w-4 h-4 text-yellow-400 bg-gray-800 border-yellow-400/30 rounded"
                        />
                        <span className="ml-2 text-gray-400">Arms</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={armor.locations?.legs || false}
                          onChange={(e) => updateArmorLocation(idx, 'legs', e.target.checked)}
                          className="w-4 h-4 text-yellow-400 bg-gray-800 border-yellow-400/30 rounded"
                        />
                        <span className="ml-2 text-gray-400">Legs</span>
                      </label>
                    </div>
                  </div>

                  {/* Armor Notes */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Notes (Comlink, MFTAS, special features, etc.)</label>
                    <textarea
                      value={armor.notes || ''}
                      onChange={(e) => updateArmor(idx, 'notes', e.target.value)}
                      rows={3}
                      placeholder="Comlink: Helmet contains tongue-activated comlink.&#10;MFTAS: +2D to Perception in low-visibility..."
                      className="w-full bg-gray-800 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400 text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addArmor}
                className="w-full px-4 py-2 bg-gray-900 border border-yellow-400/30 rounded text-yellow-400 hover:bg-gray-800"
              >
                + Add Armor
              </button>
            </div>
          </section>

          {/* Equipment */}
          <section className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">Equipment</h2>
            <div className="space-y-3">
              {(data.equipment || []).map((item, idx) => {
                // Handle both old string format and new object format
                const name = typeof item === 'string' ? item : item.name || '';
                const cost = typeof item === 'string' ? undefined : item.cost;

                return (
                  <div key={idx} className="flex gap-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => updateEquipmentItem(idx, 'name', e.target.value)}
                      placeholder="Equipment name (e.g., Medpac, Comlink)"
                      className="flex-1 bg-gray-900 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                    />
                    <input
                      type="number"
                      value={cost || ''}
                      onChange={(e) => updateEquipmentItem(idx, 'cost', parseInt(e.target.value) || undefined)}
                      placeholder="Cost"
                      className="w-32 bg-gray-900 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeEquipmentItem(idx)}
                      className="px-3 py-2 bg-red-900/30 border border-red-500/30 rounded text-red-400 hover:bg-red-900/50 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addEquipment}
                className="w-full px-4 py-2 bg-gray-900 border border-yellow-400/30 rounded text-yellow-400 hover:bg-gray-800"
              >
                + Add Equipment
              </button>
            </div>
          </section>

          {/* Special Abilities */}
          <section className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">Special Abilities</h2>
            <div className="space-y-3">
              {(data.specialAbilities || []).map((ability, idx) => (
                <div key={idx} className="flex gap-3">
                  <input
                    type="text"
                    value={ability}
                    onChange={(e) => updateSpecialAbility(idx, e.target.value)}
                    placeholder="Special ability name or description"
                    className="flex-1 bg-gray-900 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecialAbility(idx)}
                    className="px-3 py-2 bg-red-900/30 border border-red-500/30 rounded text-red-400 hover:bg-red-900/50 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSpecialAbility}
                className="w-full px-4 py-2 bg-gray-900 border border-yellow-400/30 rounded text-yellow-400 hover:bg-gray-800"
              >
                + Add Special Ability
              </button>
            </div>
          </section>

          {/* Edges and Complications */}
          <section className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">Edges and Complications</h2>
            <textarea
              value={data.edgesAndComplications || ''}
              onChange={(e) => updateData('edgesAndComplications', e.target.value)}
              rows={6}
              placeholder="Character edges (advantages, benefits) and complications (disadvantages, weaknesses, obligations)..."
              className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
            />
          </section>

          {/* Notes */}
          <section className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">Notes</h2>
            <textarea
              value={data.notes || ''}
              onChange={(e) => updateData('notes', e.target.value)}
              rows={4}
              placeholder="Force training, house rules, special notes..."
              className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
            />
          </section>

          {/* Background */}
          <section className="bg-gray-800 border-2 border-yellow-400/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6 text-yellow-400">Background</h2>
            <textarea
              value={data.background || ''}
              onChange={(e) => updateData('background', e.target.value)}
              rows={6}
              placeholder="Character's history and story..."
              className="w-full bg-gray-900 border border-yellow-400/30 rounded px-4 py-2 text-yellow-400 focus:outline-none focus:border-yellow-400"
            />
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-800">
            <Link
              to="/characters"
              className="px-6 py-3 bg-gray-800 border-2 border-gray-700 rounded text-gray-400 hover:border-gray-600 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
            >
              {saving ? 'Creating...' : 'Create Character'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
