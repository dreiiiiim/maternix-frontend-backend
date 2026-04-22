'use client';

import { useMemo, useState } from 'react';

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  sizeClassName?: string;
  className?: string;
  fallbackClassName?: string;
  fallbackBackgroundColor?: string;
};

export function UserAvatar({
  name,
  avatarUrl,
  sizeClassName = 'w-8 h-8',
  className = '',
  fallbackClassName = 'text-white text-sm font-semibold',
  fallbackBackgroundColor = 'var(--brand-pink-dark)',
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const initials = useMemo(() => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return 'U';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [name]);

  const canRenderImage = Boolean(avatarUrl) && !imageFailed;

  return (
    <div
      className={`${sizeClassName} rounded-full overflow-hidden flex items-center justify-center ${className}`.trim()}
      style={{ backgroundColor: canRenderImage ? 'transparent' : fallbackBackgroundColor }}
    >
      {canRenderImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl ?? ''}
          alt={`${name} profile`}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={fallbackClassName}>{initials}</span>
      )}
    </div>
  );
}
