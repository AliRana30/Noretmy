'use client';

import React from 'react';
import { User } from 'lucide-react';

interface FallbackAvatarProps {
  src?: string | null;
  alt: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const FallbackAvatar: React.FC<FallbackAvatarProps> = ({
  src,
  alt,
  name,
  className = '',
  size = 'md',
}) => {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const shouldShowFallback = !src || imageError || src === 'null' || src === '';

  if (shouldShowFallback) {
    const initial = name?.charAt(0).toUpperCase() || alt?.charAt(0).toUpperCase() || 'U';

    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold`}
      >
        {name ? initial : <User className={iconSizes[size]} />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover`}
      onError={() => setImageError(true)}
    />
  );
};

export default FallbackAvatar;
