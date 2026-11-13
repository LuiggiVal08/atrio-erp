import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/core/components/AnimatedNumber';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color?: 'accent' | 'success' | 'warning' | 'error';
}

const colorMap = {
  accent: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    icon: 'text-accent',
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    icon: 'text-success',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    icon: 'text-warning',
  },
  error: {
    bg: 'bg-error/10',
    text: 'text-error',
    icon: 'text-error',
  },
};

export function KpiCard({ title, value, change, icon: Icon, color = 'accent' }: KpiCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-surface p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{title}</span>
        <div className={`rounded-lg p-1.5 ${colors.bg}`}>
          <Icon size={16} className={colors.icon} />
        </div>
      </div>
      <span className="text-2xl font-bold text-text-primary">
        {typeof value === 'number' ? (
          <AnimatedNumber
            value={value}
            format={(v) =>
              v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }
          />
        ) : (
          value
        )}
      </span>
      {change !== undefined && (
        <div className="flex items-center gap-1">
          <span
            className={`text-xs font-medium ${
              change >= 0 ? 'text-success' : 'text-error'
            }`}
          >
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-xs text-text-secondary">vs período anterior</span>
        </div>
      )}
    </motion.div>
  );
}
