import { sileo } from 'sileo';

interface ToastConfig {
  title: string;
  description?: string;
  duration?: number | null;
  styles?: Record<string, string>;
}

interface ToastResult {
  title: string;
  description?: string;
}

export const toastService = {
  success: (title: string, description?: string) => {
    sileo.success({ title, description });
  },

  error: (title: string, description?: string) => {
    sileo.error({ title, description });
  },

  loading: (title: string, description?: string) => {
    sileo.show({ title, description, type: 'loading' });
  },

  promise: <T>(
    promise: Promise<T>,
    config: {
      loading: ToastConfig;
      success: (result: T) => ToastResult;
      error: (err: unknown) => ToastResult;
    },
  ): Promise<T> => {
    return sileo.promise(
      () => promise,
      {
        loading: { title: config.loading.title, description: config.loading.description },
        success: (data: T) => {
          const res = config.success(data);
          return { title: res.title, description: res.description };
        },
        error: (err: unknown) => {
          const res = config.error(err);
          return { title: res.title, description: res.description };
        },
      },
    );
  },
};
