// Sileo wrapper — lightweight promise-based toasts
// Implements the mutation pattern from integration-spec.md section 2.2

interface ToastConfig {
  title: string;
  description: string;
  styles?: Record<string, string>;
}

interface ToastResult {
  title: string;
  description: string;
  styles?: Record<string, string>;
}

export const toastService = {
  success: (title: string, description?: string) => {
    // Placeholder — Sileo Toaster is rendered in AppProvider
    console.info('[toast:success]', title, description);
  },

  error: (title: string, description?: string) => {
    console.error('[toast:error]', title, description);
  },

  loading: (title: string, description?: string) => {
    console.info('[toast:loading]', title, description);
  },

  promise: <T>(
    promise: Promise<T>,
    config: {
      loading: ToastConfig;
      success: (result: T) => ToastResult;
      error: (err: unknown) => ToastResult;
    },
  ): Promise<T> => {
    toastService.loading(config.loading.title, config.loading.description);
    return promise
      .then((result) => {
        const res = config.success(result);
        toastService.success(res.title, res.description);
        return result;
      })
      .catch((err) => {
        const res = config.error(err);
        toastService.error(res.title, res.description);
        throw err;
      });
  },
};
