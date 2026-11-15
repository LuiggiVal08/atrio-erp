import { motion, useReducedMotion } from 'framer-motion';
import type { CSSProperties } from 'react';

interface AnimatedBarProps {
  value: number;
  className?: string;
  duration?: number;
  enabled?: boolean;
  style?: CSSProperties;
}

export function AnimatedBar({ value, className = '', duration = 0.7, enabled = true, style }: AnimatedBarProps) {
  const reduceMotion = useReducedMotion();
  const target = Math.max(0, Math.min(100, value));
  const animDuration = reduceMotion || !enabled ? 0 : duration;

  return (
    <motion.div
      className={className}
      style={{ width: `${target}%`, transformOrigin: 'left', ...style }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: animDuration, ease: 'easeOut' }}
    />
  );
}
