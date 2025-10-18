import { createSignal } from 'solid-js';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const [toasts, setToasts] = createSignal<Toast[]>([]);

let toastIdCounter = 0;

export const toastStore = {
  get toasts() {
    return toasts();
  },

  show(type: ToastType, message: string, duration = 5000) {
    const id = `toast-${++toastIdCounter}`;
    const toast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  },

  success(message: string, duration?: number) {
    return this.show('success', message, duration);
  },

  error(message: string, duration?: number) {
    return this.show('error', message, duration);
  },

  warning(message: string, duration?: number) {
    return this.show('warning', message, duration);
  },

  info(message: string, duration?: number) {
    return this.show('info', message, duration);
  },

  remove(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  },

  clear() {
    setToasts([]);
  },
};
