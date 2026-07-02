import { useAuthStore } from '@/core/auth/store';
import { t } from '@/i18n/i18n';

export function useTranslation() {
  const locale = useAuthStore((s) => s.user?.locale ?? 'es');

  return {
    t: (key: string) => t(key, locale),
    locale,
  };
}
