/**
 * AbilitiesPanel Component
 *
 * Displays special abilities and story factors
 */

import type { NamedText } from '@/types';

interface AbilitiesPanelProps {
  specialAbilities?: NamedText[];
  storyFactors?: NamedText[];
}

export function AbilitiesPanel({
  specialAbilities = [],
  storyFactors = [],
}: AbilitiesPanelProps) {
  const hasAbilities = specialAbilities.length > 0;
  const hasFactors = storyFactors.length > 0;

  if (!hasAbilities && !hasFactors) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Special Abilities */}
      {hasAbilities && (
        <div className="card">
          <h3 className="text-lg font-heading text-accent-400 mb-4">
            Special Abilities
          </h3>
          <div className="space-y-3">
            {specialAbilities.map((ability, index) => (
              <div
                key={index}
                className="p-3 bg-charcoal-800 rounded border border-accent-400/20"
              >
                <h4 className="text-sm font-heading text-accent-400 mb-1">
                  {ability.name}
                </h4>
                <p className="text-sm text-gray-300">{ability.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Story Factors */}
      {hasFactors && (
        <div className="card">
          <h3 className="text-lg font-heading text-accent-400 mb-4">
            Story Factors
          </h3>
          <div className="space-y-3">
            {storyFactors.map((factor, index) => (
              <div
                key={index}
                className="p-3 bg-charcoal-800 rounded border border-accent-400/20"
              >
                <h4 className="text-sm font-heading text-accent-400 mb-1">
                  {factor.name}
                </h4>
                <p className="text-sm text-gray-300">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
