import React from 'react';

interface ActiveLogoProps {
  variant?: 'full' | 'isologo' | 'stamp' | 'badge';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ActiveLogo: React.FC<ActiveLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';

  // SVG representation of the brand's iconic Lambda / Stylized Chevron "A"
  const LambdaIcon = () => (
    <svg
      viewBox="0 0 100 100"
      className={`${iconSize} fill-current flex-shrink-0 transition-transform`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer bold triangular chevron Λ */}
      <polygon
        points="50,10 92,90 68,90 50,48 32,90 8,90"
        className="fill-white"
      />
      {/* Dynamic orange inner accent */}
      <polygon
        points="50,56 62,84 38,84"
        className="fill-[#f97316]"
      />
    </svg>
  );

  // Circular Badge (Λ)
  if (variant === 'badge') {
    return (
      <div
        className={`rounded-full border-2 border-zinc-900 flex items-center justify-center p-1 bg-zinc-950 text-white ${className}`}
      >
        <svg viewBox="0 0 100 100" className="w-6 h-6 fill-white">
          <polygon points="50,15 88,85 68,85 50,46 32,85 12,85" />
          <polygon points="50,54 62,80 38,80" fill="#f97316" />
        </svg>
      </div>
    );
  }

  // Stamp: "ENTRENAMOS SONRISAS" with branding orange and violet
  if (variant === 'stamp') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-200 bg-violet-50 text-[11px] font-black uppercase tracking-wider text-violet-700 shadow-xs ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <span>Entrenamos Sonrisas</span>
      </div>
    );
  }

  // Isologo only
  if (variant === 'isologo') {
    return (
      <div className={`flex items-center justify-center p-2 rounded-2xl bg-zinc-950 text-white shadow-sm ${className}`}>
        <LambdaIcon />
      </div>
    );
  }

  // Full branding with typography
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative p-1.5 rounded-xl bg-zinc-950 text-white shadow-sm">
        <LambdaIcon />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-base sm:text-lg font-black tracking-tight text-zinc-950 uppercase font-sans">
            ACTIVE<span className="text-orange-500 font-extrabold">FUNCTIONAL</span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-orange-500 text-white">
            STUDIO
          </span>
        </div>
        <p className="text-[10px] font-semibold tracking-wide text-zinc-500">
          Entrenamos personas • 100% Pesos Libres
        </p>
      </div>
    </div>
  );
};
