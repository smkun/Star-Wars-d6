/**
 * ImagePlaceholder Component
 *
 * Displays silhouette with species initials when image not available
 */

interface ImagePlaceholderProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const SIZE_CLASSES: Record<'small' | 'medium' | 'large', string> = {
  small: 'w-16 h-16 text-lg',
  medium: 'w-32 h-32 text-3xl',
  large: 'w-64 h-64 text-6xl',
};

export function ImagePlaceholder({
  name,
  size = 'medium',
  className = '',
}: ImagePlaceholderProps) {
  // Generate initials from species name
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`${SIZE_CLASSES[size]} ${className} flex items-center justify-center bg-charcoal-800 border-energy rounded-lg relative overflow-hidden`}
      aria-label={`${name} image placeholder`}
    >
      {/* Background pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-accent-400"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Silhouette */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="50" cy="35" rx="15" ry="18" className="fill-accent-400" />
        <ellipse cx="50" cy="70" rx="25" ry="30" className="fill-accent-400" />
      </svg>

      {/* Initials */}
      <span className="relative z-10 font-heading text-accent-400">
        {initials}
      </span>
    </div>
  );
}
