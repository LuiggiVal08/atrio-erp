import { useAuthStore } from './store';

export function usePermission(permission: string) {
  return useAuthStore((state) => state.user?.permissions?.includes(permission) ?? false);
}
