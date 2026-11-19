import React from 'react';
import { OFFICIAL_LOGOS } from '../lib/media';

interface AdaptiveLogoProps {
  /**
   * 'horizontal' -> Desktop header, nav, banners, B2B wide cards
   * 'vertical'   -> Footer stacked column, brand intro, mobile centered logo
   * 'auto'       -> Responsive: horizontal on compact screens, vertical on md+ portrait cards
   */
  variant?: 'horizontal' | 'vertical' | 'auto';
  /**
   * 'light' -> Original dark forest-green artwork on light backgrounds
   * 'dark'  -> Pure white inverted transparent artwork for dark / emerald / obsidian surfaces
   * 'auto'  -> Automatically switches to inverted white when html.dark is active
   */
  surface?: 'light' | 'dark' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<'horizontal' | 'vertical', Record<'xs' | 'sm' | 'md' | 'lg', string>> = {
  horizontal: {
    xs: 'h-7 w-auto max-w-[140px]',
    sm: 'h-8 sm:h-9 w-auto max-w-[180px]',
    md: 'h-10 sm:h-12 w-auto max-w-[230px]',
    lg: 'h-14 sm:h-16 w-auto max-w-[300px]',
  },
  vertical: {
    xs: 'h-11 sm:h-12 w-auto max-w-[116px]',
    sm: 'h-20 w-auto max-w-[160px]',
    md: 'h-28 w-auto max-w-[210px]',
    lg: 'h-36 w-auto max-w-[260px]',
  },
};

export const AdaptiveLogo: React.FC<AdaptiveLogoProps> = ({
  variant = 'horizontal',
  surface = 'light',
  size = 'sm',
  className = '',
}) => {
  const toneClass =
    surface === 'dark'
      ? 'brightness-0 invert'
      : surface === 'auto'
        ? 'dark:brightness-0 dark:invert'
        : '';

  if (variant === 'auto') {
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        <img
          src={OFFICIAL_LOGOS.horizontal}
          alt="ROAR COFFEE® — Igniting Courage. Defining Character."
          className={`md:hidden object-contain select-none transition-all duration-200 ${SIZE_CLASSES.horizontal[size]} ${toneClass}`}
          referrerPolicy="no-referrer"
        />
        <img
          src={OFFICIAL_LOGOS.vertical}
          alt="ROAR COFFEE® — Igniting Courage. Defining Character."
          className={`hidden md:block object-contain select-none transition-all duration-200 ${SIZE_CLASSES.vertical[size]} ${toneClass}`}
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  const src = variant === 'vertical' ? OFFICIAL_LOGOS.vertical : OFFICIAL_LOGOS.horizontal;
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={src}
        alt="ROAR COFFEE® — Igniting Courage. Defining Character."
        className={`object-contain select-none transition-all duration-200 ${SIZE_CLASSES[variant][size]} ${toneClass}`}
        referrerPolicy="no-referrer"
      />
    </span>
  );
};
