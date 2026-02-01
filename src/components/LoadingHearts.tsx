'use client';

import { Heart } from 'lucide-react';

interface LoadingHeartsProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingHearts({ size = 'md' }: LoadingHeartsProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex space-x-2">
      <Heart 
        className={`${sizes[size]} text-pink-500 fill-pink-500 animate-bounce`}
        style={{ animationDelay: '0s' }}
      />
      <Heart 
        className={`${sizes[size]} text-pink-500 fill-pink-500 animate-bounce`}
        style={{ animationDelay: '0.2s' }}
      />
      <Heart 
        className={`${sizes[size]} text-pink-500 fill-pink-500 animate-bounce`}
        style={{ animationDelay: '0.4s' }}
      />
    </div>
  );
}