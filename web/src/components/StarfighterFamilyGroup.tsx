import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Weapon {
  name: string;
  fireArc?: string;
  damage?: string;
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

interface StarfighterFamilyGroupProps {
  familyName: string;
  baseShip?: Starship;
  variants: Starship[];
  defaultExpanded?: boolean;
}

export function StarfighterFamilyGroup({
  familyName,
  baseShip,
  variants,
  defaultExpanded = false
}: StarfighterFamilyGroupProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const sortedVariants = [...variants].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="border border-yellow-400/30 rounded-lg bg-[#101628]/50 overflow-hidden">
      {/* Family Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-[#101628]/80 hover:bg-[#1a2030] transition-colors border-b border-yellow-400/20"
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl text-yellow-400">
            {isExpanded ? '▼' : '▶'}
          </span>
          <div className="text-left">
            <h3 className="text-2xl font-bold text-yellow-100">
              {familyName}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {variants.length} variant{variants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {baseShip && baseShip.imageUrl && (
          <img
            src={baseShip.imageUrl}
            alt={familyName}
            className="w-16 h-16 object-contain opacity-80"
          />
        )}
      </button>

      {/* Expanded Variant List */}
      {isExpanded && (
        <div className="p-4">
          {/* Base Ship (if exists) */}
          {baseShip && (
            <div
              onClick={() => navigate(`/starships/${baseShip.id}`)}
              className="mb-4 p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/40 hover:border-yellow-400 cursor-pointer transition-all group"
            >
              <div className="flex items-start gap-4">
                {baseShip.imageUrl && (
                  <img
                    src={baseShip.imageUrl}
                    alt={baseShip.name}
                    className="w-20 h-20 object-contain"
                  />
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-yellow-100 group-hover:text-yellow-300">
                    {baseShip.name}
                    <span className="ml-2 text-xs font-normal text-yellow-400/60">
                      BASE MODEL
                    </span>
                  </h4>
                  {baseShip.craft && (
                    <p className="text-sm text-gray-400 mt-1">{baseShip.craft}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {baseShip.affiliation && (
                      <span className="px-2 py-1 rounded bg-yellow-400/10 text-yellow-300">
                        {baseShip.affiliation}
                      </span>
                    )}
                    {baseShip.hull && <span>Hull: {baseShip.hull}</span>}
                    {baseShip.shields && <span>Shields: {baseShip.shields}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Variants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedVariants.map((variant) => (
              <div
                key={variant.id}
                onClick={() => navigate(`/starships/${variant.id}`)}
                className="p-3 rounded-lg bg-[#0a0e1a]/50 border border-yellow-400/20 hover:border-yellow-400/60 hover:bg-[#0a0e1a] cursor-pointer transition-all group"
              >
                <div className="flex items-start gap-3">
                  {variant.imageUrl && (
                    <img
                      src={variant.imageUrl}
                      alt={variant.name}
                      className="w-12 h-12 object-contain opacity-80 group-hover:opacity-100"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-semibold text-gray-200 group-hover:text-yellow-300 truncate">
                      {variant.name}
                    </h5>
                    {variant.craft && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {variant.craft}
                      </p>
                    )}
                    {variant.type && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {variant.type}
                      </p>
                    )}
                  </div>
                </div>
                {/* Quick Stats */}
                <div className="flex gap-3 mt-2 text-xs text-gray-600">
                  {variant.hull && <span>Hull: {variant.hull}</span>}
                  {variant.shields && <span>Shields: {variant.shields}</span>}
                  {variant.space && <span>Speed: {variant.space}</span>}
                </div>
              </div>
            ))}
          </div>

          {variants.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No variants found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
