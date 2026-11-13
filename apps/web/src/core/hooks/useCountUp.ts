import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface CountUpOptions {
  duration?: number;
  enabled?: boolean;
}

export function useCountUp(value: number, options: CountUpOptions = {}): number {
  const { duration = 0.9, enabled = true } = options;
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    if (!enabled || reduceMotion) {
      currentRef.current = value;
      setDisplay(value);
      return;
    }

    const controls = animate(currentRef.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        currentRef.current = latest;
        setDisplay(latest);
      },
    });

    return () => controls.stop();
  }, [value, duration, enabled, reduceMotion]);

  return display;
}
