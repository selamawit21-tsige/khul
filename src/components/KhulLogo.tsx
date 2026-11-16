import React, {useState} from 'react';

interface KhulLogoProps {
  logoUrl?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<KhulLogoProps['size']>, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

export const KhulLogoFallbackSVG: React.FC<{className?: string}> = ({className = 'w-full h-full'}) => (
  <svg viewBox="0 0 128 128" className={className} aria-hidden="true" fill="none">
    <circle cx="64" cy="64" r="62" fill="#F1931E" />
    {/* Minimalist geometric lotus / Khul emblem */}
    <path
      d="M64 26c-8 14-14 26-14 38 0 9 6.3 16 14 16s14-7 14-16c0-12-6-24-14-38z"
      stroke="#1F3A3D"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    <path
      d="M44 45c-11 6-18 16-18 27 0 9 8 15 20 15"
      stroke="#1F3A3D"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M84 45c11 6 18 16 18 27 0 9-8 15-20 15"
      stroke="#1F3A3D"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <circle cx="64" cy="96" r="4" fill="#1F3A3D" />
  </svg>
);

export const KhulLogo: React.FC<KhulLogoProps> = ({
  logoUrl = '/assets/aistudio/khul_e2c6af73.jpg',
  alt = 'Khul World Logo',
  size = 'md',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full overflow-hidden shrink-0 bg-[#F1931E] ring-1 ring-[#F1931E]/40 flex items-center justify-center ${className}`}
    >
      {!failed && logoUrl ? (
        <img
          src={logoUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover scale-[1.08]"
        />
      ) : (
        <KhulLogoFallbackSVG className="w-full h-full" />
      )}
    </div>
  );
};
