import type { CSSProperties } from 'react';

type SkeletonVariant = 'text' | 'rect' | 'circle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

const RADIUS: Record<SkeletonVariant, string> = {
  text: 'rounded',
  rect: 'rounded-md',
  circle: 'rounded-full',
};

const DEFAULT_HEIGHT: Record<SkeletonVariant, string> = {
  text: '0.75rem',
  rect: '1rem',
  circle: '2.5rem',
};

export function Skeleton({ variant = 'rect', width, height, className = '', style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton ${RADIUS[variant]} ${className}`}
      style={{ width, height: height ?? DEFAULT_HEIGHT[variant], ...style }}
    />
  );
}
