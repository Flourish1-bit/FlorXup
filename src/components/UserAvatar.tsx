import React from 'react';

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

const GRADIENT_PALETTES = [
  'from-emerald-500 to-teal-700',
  'from-cyan-500 to-blue-600',
  'from-indigo-500 to-purple-600',
  'from-amber-500 to-rose-600',
  'from-teal-500 to-emerald-700',
  'from-violet-500 to-fuchsia-600',
];

export function getInitials(name: string): string {
  if (!name) return 'U';
  const clean = name.replace(/[^a-zA-Z0-9\s_]/g, '').trim();
  const parts = clean.split(/[\s_]+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'U';
}

export function getGradientForName(name: string): string {
  if (!name) return GRADIENT_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  username,
  avatarUrl,
  size = 'md',
  isOnline,
  className = '',
}) => {
  const sizeMap = {
    xs: { container: 'w-7 h-7 text-[10px]', badge: 'w-2 h-2' },
    sm: { container: 'w-8 h-8 text-xs', badge: 'w-2.5 h-2.5' },
    md: { container: 'w-10 h-10 text-xs font-bold tracking-tight', badge: 'w-3 h-3' },
    lg: { container: 'w-12 h-12 text-sm font-bold tracking-tight', badge: 'w-3.5 h-3.5' },
    xl: { container: 'w-18 h-18 text-xl font-bold tracking-tight', badge: 'w-4 h-4' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const initials = getInitials(username);
  const gradient = getGradientForName(username);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  return (
    <div className={`relative shrink-0 ${className}`}>
      {avatarUrl && avatarUrl.trim() !== '' && !imageError ? (
        <img
          src={avatarUrl}
          alt={username}
          onError={() => setImageError(true)}
          className={`${currentSize.container} rounded-full object-cover shadow-sm ring-1 ring-white/20 select-none`}
        />
      ) : (
        <div
          className={`${currentSize.container} rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center font-bold text-white shadow-sm ring-1 ring-white/20 select-none`}
        >
          <span>{initials}</span>
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${currentSize.badge} rounded-full ring-2 ring-slate-900 ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-500'
          }`}
          title={isOnline ? 'Active now' : 'Offline'}
        />
      )}
    </div>
  );
};
