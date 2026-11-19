import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { resolveMediaUrl } from '../lib/media';

interface MediaImageProps {
  imageKey?: string;
  alt: string;
  className?: string;
  aspectClass?: string;
}

export const MediaImage: React.FC<MediaImageProps> = ({
  imageKey,
  alt,
  className = 'w-full h-full object-cover',
  aspectClass = '',
}) => {
  const [failed, setFailed] = useState(false);
  const src = resolveMediaUrl(imageKey);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#003D25] to-[#00552B] text-[#F8F5EF] p-6 text-center ${aspectClass}`}
      >
        <Coffee className="w-8 h-8 mb-2 text-[#C6A667]" />
        <span className="text-xs font-medium tracking-wide opacity-90">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      loading="lazy"
    />
  );
};
