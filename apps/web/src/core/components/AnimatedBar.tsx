import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedBarProps {
  value: number;
  className?: string;
  duration?: number;
  enabled?: boolean;
}

export function AnimatedBar({ value, className = '', duration = 0.7, enabled = true }: AnimatedBarProps) {
  const reduceMotion = useReducedMotion();
  const target = Math.max(0, Math.min(100, value));
  const animDuration = reduceMotion || !enabled ? 0 : duration;

  return (
    <motion.div
      className={className}
      style={{ width: `${target}%`, transformOrigin: 'left' }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: animDuration, ease: 'easeOut' }}
    />
  );
}
