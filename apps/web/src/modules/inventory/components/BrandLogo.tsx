import { useEffect, useState } from 'react';

interface BrandLogoProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
}

function hueFromName(name: string) {
  let hue = 0;
  for (let i = 0; i < name.length; i++) hue = (hue * 31 + name.charCodeAt(i)) % 360;
  return hue;
}

export function BrandLogo({ name, logoUrl, className = 'h-12 w-12' }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [logoUrl]);

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        onError={() => setFailed(true)}
        className={`${className} shrink-0 rounded-lg border border-border bg-white object-contain p-1`}
      />
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-lg border border-border text-sm font-bold text-white`}
      style={{ backgroundColor: `hsl(${hueFromName(name)} 55% 38%)` }}
    >
      {initials}
    </span>
  );
}