import { useSyncExternalStore } from "react";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

type Listener = () => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return toasts;
}

let counter = 0;

function push(message: string, tone: ToastTone, duration = 4000) {
  const id = `toast-${Date.now()}-${counter++}`;
  toasts = [...toasts, { id, message, tone }];
  emit();

  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, duration);
}

export const toast = {
  success: (message: string, duration?: number) => push(message, "success", duration),
  error: (message: string, duration?: number) => push(message, "error", duration),
  info: (message: string, duration?: number) => push(message, "info", duration),
};

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}
