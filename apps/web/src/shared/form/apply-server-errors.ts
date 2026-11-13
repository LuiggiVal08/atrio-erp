import { isAxiosError } from 'axios';
import type { AnyReactForm } from './types';

export interface ApplyServerErrorsResult {
  applied: string[];
  unmapped: string[];
}

const appliedByForm = new WeakMap<object, string[]>();

function readPayload(error: unknown): Record<string, unknown> | undefined {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined;
  }

  if (error && typeof error === 'object') {
    const response = (error as { response?: unknown }).response;
    if (response && typeof response === 'object') {
      const data = (response as { data?: unknown }).data;
      if (data && typeof data === 'object') {
        return data as Record<string, unknown>;
      }
    }
    return error as Record<string, unknown>;
  }

  return undefined;
}

function messagesFrom(value: unknown): string[] {
  if (typeof value === 'string') {
    return value ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.filter(
      (message): message is string => typeof message === 'string' && message.length > 0,
    );
  }
  return [];
}

function serverFieldErrors(value: unknown): { field: string; message: string }[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const { field, message } = entry as { field?: unknown; message?: unknown };
    if (typeof field !== 'string' || !field) return [];
    if (typeof message !== 'string' || !message) return [];
    return [{ field, message }];
  });
}

function unmappedMessages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const { field, message } = entry as { field?: unknown; message?: unknown };
    if (typeof field === 'string' && field) return [];
    return messagesFrom(message);
  });
}

export function clearServerErrors(form: AnyReactForm): void {
  const fields = appliedByForm.get(form) ?? [];
  for (const field of fields) {
    form.setFieldMeta(field, (meta) => ({
      ...meta,
      errorMap: { ...meta.errorMap, onServer: undefined },
    }));
  }
  appliedByForm.delete(form);
}

export function applyServerErrors(form: AnyReactForm, error: unknown): ApplyServerErrorsResult {
  clearServerErrors(form);

  const payload = readPayload(error);
  if (!payload) return { applied: [], unmapped: [] };

  const grouped = new Map<string, string[]>();
  for (const { field, message } of serverFieldErrors(payload.errors)) {
    const messages = grouped.get(field) ?? [];
    messages.push(message);
    grouped.set(field, messages);
  }

  if (grouped.size === 0) {
    return { applied: [], unmapped: messagesFrom(payload.message) };
  }

  const applied: string[] = [];
  for (const [field, messages] of grouped) {
    form.setFieldMeta(field, (meta) => ({
      ...meta,
      errorMap: { ...meta.errorMap, onServer: messages.join(' · ') },
    }));
    applied.push(field);
  }

  appliedByForm.set(form, applied);

  return { applied, unmapped: unmappedMessages(payload.errors) };
}
