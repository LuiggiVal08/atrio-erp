export function fieldErrorMessages(errors: unknown[] | undefined): string[] {
  if (!errors?.length) return [];

  return errors.flatMap((error) => {
    if (typeof error === 'string') {
      return error ? [error] : [];
    }
    if (error && typeof error === 'object') {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message) {
        return [message];
      }
    }
    return [];
  });
}
