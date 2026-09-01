import React, { useState } from 'react';
import { Disc3, Music } from 'lucide-react';

interface CDCoverProps {
  coverUrl?: string;
  title: string;
  artist: string;
  year?: number | string;
  genre?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showJewelCase?: boolean;
}

export const CDCover: React.FC<CDCoverProps> = ({
  coverUrl,
  title,
  artist,
  year,
  genre,
  size = 'md',
  className = '',
  showJewelCase = true,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-24 h-24 sm:w-28 sm:h-28 text-sm',
    lg: 'w-36 h-36 sm:w-44 sm:h-44 text-base',
    xl: 'w-56 h-56 sm:w-64 sm:h-64 text-lg',
  };

  // Deterministic color palette for fallback art based on artist & album string
  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 45) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 55%, 22%) 0%, hsl(${hue2}, 65%, 12%) 100%)`;
  };

  const gradient = getGradient(`${artist}-${title}`);

  return (
    <div
      className={`relative aspect-square shrink-0 rounded-md overflow-hidden select-none bg-zinc-900 border border-zinc-800/80 shadow-md ${sizeClasses[size]} ${className}`}
    >
      {coverUrl && !imageError ? (
        <img
          src={coverUrl}
          alt={`${title} - ${artist}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className="w-full h-full flex flex-col justify-between p-2 sm:p-3 relative overflow-hidden"
          style={{ background: gradient }}
        >
          {/* Subtle vinyl grooves background watermark */}
          <div className="absolute -right-6 -bottom-6 opacity-15 pointer-events-none">
            <Disc3 className="w-28 h-28 text-white animate-spin-slow" />
          </div>

          <div className="flex items-center justify-between z-10">
            <div className="p-1 rounded bg-black/40 backdrop-blur-xs">
              <Music className="w-3.5 h-3.5 text-zinc-300" />
            </div>
            {year && (
              <span className="text-[10px] font-mono font-medium text-zinc-400 bg-black/40 px-1.5 py-0.5 rounded">
                {year}
              </span>
            )}
          </div>

          <div className="z-10 mt-auto">
            <p className="font-bold text-white leading-tight line-clamp-2 drop-shadow-sm text-[11px] sm:text-xs">
              {title}
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-300 font-medium truncate drop-shadow-xs">
              {artist}
            </p>
          </div>
        </div>
      )}

      {/* Jewel case plastic sheen / reflection overlay */}
      {showJewelCase && (
        <>
          {/* Left spine shadow */}
          <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-white/20 via-white/5 to-transparent pointer-events-none border-r border-black/20" />
          {/* Diagonal glass glare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-70 pointer-events-none" />
          {/* Subtle rim highlight */}
          <div className="absolute inset-0 ring-1 ring-inset ring-white/15 rounded-md pointer-events-none" />
        </>
      )}
    </div>
  );
};
