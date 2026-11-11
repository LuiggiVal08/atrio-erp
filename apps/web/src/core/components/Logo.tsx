const buildFilter = (variant: LogoVariant, edgeColor: string) => {
  const edge = `color-mix(in srgb, ${edgeColor} 30%, transparent)`;
  const elevation = 'drop-shadow(0 12px 40px rgba(0,0,0,0.22))';
  if (variant === 'isologo') return elevation;
  return [
    `drop-shadow(0.75px 0 0 ${edge})`,
    `drop-shadow(-0.75px 0 0 ${edge})`,
    `drop-shadow(0 0.75px 0 ${edge})`,
    `drop-shadow(0 -0.75px 0 ${edge})`,
    elevation,
  ].join(' ');
};

type LogoVariant = 'isologo' | 'logotipo';

interface LogoProps {
  variant: LogoVariant;
  className?: string;
  edgeColor?: string;
}

export function Logo({ variant, className, edgeColor = 'currentColor' }: LogoProps) {
  return (
    <img
      src={`/logos/${variant}.png`}
      alt={variant === 'logotipo' ? 'Atrio ERP' : ''}
      className={`object-contain ${className ?? ''}`}
      style={{ filter: buildFilter(variant, edgeColor) }}
    />
  );
}