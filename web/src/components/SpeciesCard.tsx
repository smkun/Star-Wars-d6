/**
 * SpeciesCard Component
 *
 * Thumbnail card displaying species overview
 */

import type { SpeciesDocument } from '@/types';

interface SpeciesCardProps {
  species: SpeciesDocument;
  onClick?: () => void;
}

export function SpeciesCard({ species, onClick }: SpeciesCardProps) {
  return (
    <div
      className='card-hover cursor-pointer border border-yellow-500/30 bg-[#101628]/80 shadow-[0_0_0_rgba(0,0,0,0)] transition-shadow duration-200 hover:shadow-[0_0_35px_rgba(255,213,79,0.12)]'
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Header */}
      <div className='mb-3'>
        <h3 className='text-2xl font-heading text-yellow-200 drop-shadow-[0_0_12px_rgba(255,213,79,0.45)]'>
          {species.name}
        </h3>
        {species.homeworld && (
          <p className='text-sm uppercase tracking-[0.25em] text-yellow-400/70'>{species.homeworld}</p>
        )}
      </div>

      {/* Description Preview */}
      {species.description && (
        <p className='text-sm text-gray-300/90 mb-4 line-clamp-2'>
          {species.description}
        </p>
      )}

      {/* Mini Stats */}
      <div className='mt-4 flex gap-6 text-sm text-yellow-200/70'>
        <div>
          <span className='text-gray-500/60'>Dice</span>{' '}
          <span className='font-semibold text-yellow-300'>{species.stats.attributeDice}</span>
        </div>
        <div>
          <span className='text-gray-500/60'>Move</span>{' '}
          <span className='font-semibold text-yellow-300'>{species.stats.move}</span>
        </div>
      </div>

      {/* Source Chips */}
      {species.sources && species.sources.length > 0 && (
        <div className='mt-4 flex flex-wrap gap-2'>
          {species.sources.slice(0, 2).map((source, index) => (
            <span
              key={index}
              className='rounded-full border border-yellow-400/40 bg-[#1a2138]/70 px-3 py-1 text-xs uppercase tracking-[0.15em] text-yellow-200/80'
            >
              {source}
            </span>
          ))}
          {species.sources.length > 2 && (
            <span className='px-3 py-1 text-xs text-gray-400/80'>
              +{species.sources.length - 2} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
