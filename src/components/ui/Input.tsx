import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import { cn } from '@/lib/utils';

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input(props: InputProps) {
  const [local, others] = splitProps(props, [
    'label',
    'error',
    'helperText',
    'class',
  ]);

  const hasError = !!local.error;

  return (
    <div class="w-full">
      {local.label && (
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {local.label}
        </label>
      )}

      <input
        class={cn(
          'flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors',
          'placeholder:text-gray-500 dark:placeholder:text-gray-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError
            ? 'border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950'
            : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900',
          local.class
        )}
        {...others}
      />

      {local.error && (
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{local.error}</p>
      )}

      {local.helperText && !local.error && (
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {local.helperText}
        </p>
      )}
    </div>
  );
}

interface TextareaProps
  extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea(props: TextareaProps) {
  const [local, others] = splitProps(props, [
    'label',
    'error',
    'helperText',
    'class',
  ]);

  const hasError = !!local.error;

  return (
    <div class="w-full">
      {local.label && (
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {local.label}
        </label>
      )}

      <textarea
        class={cn(
          'flex min-h-[80px] w-full resize-none rounded-md border px-3 py-2 text-sm transition-colors',
          'placeholder:text-gray-500 dark:placeholder:text-gray-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError
            ? 'border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950'
            : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900',
          local.class
        )}
        {...others}
      />

      {local.error && (
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{local.error}</p>
      )}

      {local.helperText && !local.error && (
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {local.helperText}
        </p>
      )}
    </div>
  );
}
