import { useCountUp } from '@/core/hooks/useCountUp';

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  enabled?: boolean;
  className?: string;
}

export function AnimatedNumber({
  value,
  format,
  duration,
  enabled,
  className,
}: AnimatedNumberProps) {
  const animated = useCountUp(value, { duration, enabled });
  const text = format ? format(animated) : Math.round(animated).toLocaleString();

  return <span className={className}>{text}</span>;
}
