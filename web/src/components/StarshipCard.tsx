/**
 * StarshipCard Component
 *
 * Thumbnail card displaying starship overview
 */

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
  imageFilename?: string;
  parent?: string;
  variantOf?: string;
  isVariant?: boolean;
}

interface StarshipCardProps {
  ship: Starship;
  onClick?: () => void;
  fallbackImageUrl?: string; // Generic family image for variants without their own image
}

export function StarshipCard({ ship, onClick, fallbackImageUrl }: StarshipCardProps) {
  const categoryLabel = {
    starfighter: 'Starfighter',
    transport: 'Transport',
    capital: 'Capital Ship',
    other: 'Other'
  }[ship.category] || ship.category;

  // Build image path matching detail page pattern
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  // Use imageFilename to build full path, or use imageUrl if it's already a full path
  let imageUrl = '';
  if (ship.imageFilename) {
    imageUrl = `${normalizedBase}starships/${ship.imageFilename.replace(/^\/+/, '')}`;
  } else if (ship.imageUrl && !ship.imageUrl.startsWith('http')) {
    // imageUrl is just a filename, build the path
    imageUrl = `${normalizedBase}starships/${ship.imageUrl.replace(/^\/+/, '')}`;
  } else if (ship.imageUrl) {
    // imageUrl is already a full URL
    imageUrl = ship.imageUrl;
  } else if (fallbackImageUrl) {
    // Use fallback if provided
    imageUrl = fallbackImageUrl;
  }

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
      {/* Ship Image */}
      {imageUrl && (
        <div className='relative h-48 w-full overflow-hidden rounded-t-lg border-b border-yellow-400/20 bg-[#0a0f1e]/60'>
          <img
            src={imageUrl}
            alt={ship.name}
            className='h-full w-full object-contain p-2'
            loading="lazy"
          />
          {!ship.imageUrl && fallbackImageUrl && (
            <div className='absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-yellow-400/60'>
              Generic
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className='mb-3 mt-3'>
        <h3 className='text-2xl font-heading text-yellow-200 drop-shadow-[0_0_12px_rgba(255,213,79,0.45)]'>
          {ship.name}
        </h3>
        {ship.isVariant && ship.parent && (
          <p className='text-xs text-yellow-400/60 mt-1'>Variant of {ship.parent}</p>
        )}
        {ship.craft && (
          <p className='text-sm text-gray-300/80 mt-1'>{ship.craft}</p>
        )}
        <div className='flex items-center gap-2 mt-2'>
          <span className='text-xs uppercase tracking-[0.25em] text-yellow-400/70'>
            {categoryLabel}
          </span>
          {ship.affiliation && (
            <>
              <span className='text-yellow-400/40'>•</span>
              <span className='text-xs text-gray-400/80'>{ship.affiliation}</span>
            </>
          )}
        </div>
      </div>

      {/* Key Stats */}
      <div className='mt-4 grid grid-cols-2 gap-3 text-sm'>
        {ship.scale && (
          <div>
            <span className='text-gray-500/60'>Scale</span>{' '}
            <span className='font-semibold text-yellow-300'>{ship.scale}</span>
          </div>
        )}
        {ship.hyperdrive && (
          <div>
            <span className='text-gray-500/60'>Hyperdrive</span>{' '}
            <span className='font-semibold text-yellow-300'>{ship.hyperdrive}</span>
          </div>
        )}
        {ship.maneuverability && (
          <div>
            <span className='text-gray-500/60'>Maneuver</span>{' '}
            <span className='font-semibold text-yellow-300'>{ship.maneuverability}</span>
          </div>
        )}
        {ship.hull && (
          <div>
            <span className='text-gray-500/60'>Hull</span>{' '}
            <span className='font-semibold text-yellow-300'>{ship.hull}</span>
          </div>
        )}
      </div>

      {/* Weapons Count */}
      {ship.weapons.length > 0 && (
        <div className='mt-4 pt-3 border-t border-yellow-400/20'>
          <span className='text-xs text-gray-400/80'>
            {ship.weapons.length} weapon{ship.weapons.length !== 1 ? 's' : ''}
          </span>
          <div className='flex flex-wrap gap-1 mt-2'>
            {ship.weapons.slice(0, 3).map((weapon, idx) => (
              <span
                key={idx}
                className='text-xs text-yellow-200/60'
              >
                {weapon.name}
                {idx < Math.min(2, ship.weapons.length - 1) && ','}
              </span>
            ))}
            {ship.weapons.length > 3 && (
              <span className='text-xs text-gray-400/60'>
                +{ship.weapons.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
