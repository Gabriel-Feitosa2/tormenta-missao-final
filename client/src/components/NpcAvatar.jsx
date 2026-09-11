import React, { useState, useEffect } from 'react';
import { Skull, AlertTriangle, ShieldCheck, Heart, Sparkles, Shield, Swords } from 'lucide-react';

const SIZE_MAP = {
  xs: {
    container: 'w-7 h-7 min-w-[28px] text-[11px]',
    badge: 'w-3 h-3 -bottom-0.5 -right-0.5',
    iconSize: 'w-2 h-2',
  },
  sm: {
    container: 'w-9 h-9 min-w-[36px] text-xs',
    badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    iconSize: 'w-2.5 h-2.5',
  },
  md: {
    container: 'w-12 h-12 min-w-[48px] text-sm',
    badge: 'w-4 h-4 -bottom-1 -right-1',
    iconSize: 'w-3 h-3',
  },
  lg: {
    container: 'w-16 h-16 min-w-[64px] text-lg',
    badge: 'w-5 h-5 -bottom-1 -right-1',
    iconSize: 'w-3.5 h-3.5',
  },
  xl: {
    container: 'w-20 h-20 min-w-[80px] text-2xl',
    badge: 'w-6 h-6 -bottom-1 -right-1',
    iconSize: 'w-4 h-4',
  },
  '2xl': {
    container: 'w-24 h-24 min-w-[96px] text-3xl',
    badge: 'w-7 h-7 -bottom-1.5 -right-1.5',
    iconSize: 'w-4.5 h-4.5',
  },
};

export const NpcAvatar = ({
  npc,
  size = 'md',
  showStatusRing = true,
  showBadge = true,
  className = '',
  onClick,
}) => {
  if (!npc) return null;

  const [hasError, setHasError] = useState(false);
  const [extIdx, setExtIdx] = useState(0);

  const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
  const customSrc = npc.avatar || npc.image;
  const src = customSrc || `/npcs/${npc.id}${EXTENSIONS[extIdx] || '.png'}`;

  useEffect(() => {
    setExtIdx(0);
    setHasError(false);
  }, [npc.id, npc.avatar, npc.image]);

  const handleError = () => {
    if (!customSrc && extIdx + 1 < EXTENSIONS.length) {
      setExtIdx((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const isDead = npc.status === 'dead' || (npc.willFailures !== undefined && npc.willFailures >= 3);
  const isWounded = npc.status === 'wounded';
  const isWithdrawn = npc.status === 'withdrawn';
  const isUsed = npc.usedThisRound;

  // Initials for fallback (e.g., "Asora" -> "AS", "Borus*" -> "BO", "K" -> "K")
  const cleanName = (npc.name || npc.id || '').replace(/[^a-zA-Z0-9]/g, '');
  const initials =
    cleanName.length >= 2 ? cleanName.substring(0, 2).toUpperCase() : cleanName.toUpperCase() || 'NPC';

  // Ring styling
  let ringClasses = 'border-2 border-red-900/80';
  if (showStatusRing) {
    if (isDead) {
      ringClasses = 'border-2 border-red-800 ring-2 ring-red-950 opacity-60 grayscale';
    } else if (isWounded) {
      ringClasses = 'border-2 border-amber-500 ring-2 ring-amber-500/50 animate-pulse';
    } else if (isWithdrawn) {
      ringClasses = 'border-2 border-blue-500 ring-2 ring-blue-500/50';
    } else if (isUsed) {
      ringClasses = 'border-2 border-red-500 ring-2 ring-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]';
    } else if (npc.isIntimate) {
      ringClasses = 'border-2 border-amber-500/80 ring-1 ring-amber-500/40';
    } else if (npc.isHealer) {
      ringClasses = 'border-2 border-emerald-600/80 ring-1 ring-emerald-500/30';
    } else {
      ringClasses = 'border-2 border-red-800/80 hover:border-red-600';
    }
  }

  // Background tint for fallback token
  let bgClasses = 'from-red-950 via-[#18060c] to-black';
  if (npc.isHealer) {
    bgClasses = 'from-emerald-950/90 via-[#120a10] to-black';
  } else if (npc.isImmune) {
    bgClasses = 'from-purple-950/90 via-[#120614] to-black';
  } else if (npc.isIntimate) {
    bgClasses = 'from-amber-950/90 via-[#1a0e08] to-black';
  }

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none overflow-visible shadow-xl transition-transform ${sizeConfig.container} ${ringClasses} ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      } ${className}`}
      title={`${npc.name}${npc.isHealer ? ' (Curador)' : ''}${npc.isIntimate ? ' (Íntimo)' : ''}`}
    >
      {/* Inner Image or Fallback Token */}
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black">
        {!hasError ? (
          <img
            src={src}
            alt={npc.name}
            onError={handleError}
            className="w-full h-full object-cover object-center transition-all duration-300"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-b ${bgClasses} flex flex-col items-center justify-center relative`}
          >
            {/* Subtle background icon for role flavor */}
            {npc.isHealer ? (
              <Heart className="w-1/2 h-1/2 text-emerald-500/20 absolute" />
            ) : npc.attack ? (
              <Swords className="w-1/2 h-1/2 text-red-500/20 absolute" />
            ) : (
              <Shield className="w-1/2 h-1/2 text-amber-500/20 absolute" />
            )}
            <span className="font-medieval font-black text-amber-200 tracking-wider relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* Dead X / Skull Overlay on image */}
      {isDead && (
        <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
          <Skull className="w-3/5 h-3/5 text-red-500 drop-shadow-[0_0_6px_rgba(220,38,38,0.9)]" />
        </div>
      )}

      {/* Corner Status Badge */}
      {showBadge && (
        <div
          className={`absolute z-20 rounded-full flex items-center justify-center shadow-lg border border-black ${sizeConfig.badge} ${
            isDead
              ? 'bg-red-950 text-red-400 border-red-700'
              : isWounded
              ? 'bg-amber-950 text-amber-400 border-amber-500 animate-pulse'
              : isWithdrawn
              ? 'bg-blue-950 text-blue-300 border-blue-500'
              : npc.isHealer
              ? 'bg-emerald-950 text-emerald-400 border-emerald-500'
              : npc.isIntimate
              ? 'bg-amber-950 text-amber-300 border-amber-500'
              : npc.isImmune
              ? 'bg-purple-950 text-purple-300 border-purple-500'
              : 'bg-red-950 text-red-300 border-red-800'
          }`}
        >
          {isDead ? (
            <Skull className={sizeConfig.iconSize} />
          ) : isWounded ? (
            <AlertTriangle className={sizeConfig.iconSize} />
          ) : isWithdrawn ? (
            <ShieldCheck className={sizeConfig.iconSize} />
          ) : npc.isHealer ? (
            <Heart className={sizeConfig.iconSize} />
          ) : npc.isIntimate ? (
            <Sparkles className={sizeConfig.iconSize} />
          ) : npc.isImmune ? (
            <Shield className={sizeConfig.iconSize} />
          ) : (
            <Swords className={sizeConfig.iconSize} />
          )}
        </div>
      )}
    </div>
  );
};
