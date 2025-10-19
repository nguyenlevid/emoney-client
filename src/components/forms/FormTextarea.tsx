import type { Component } from 'solid-js';
import { Show, splitProps } from 'solid-js';
import { cn } from '@/lib/utils/cn';

interface FormTextareaProps {
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  class?: string;
  tabIndex?: number;
  onInput?: (value: string) => void;
  onBlur?: (e: FocusEvent) => void;
  ref?: (element: HTMLTextAreaElement) => void;
}

export const FormTextarea: Component<FormTextareaProps> = (props) => {
  const [local, others] = splitProps(props, [
    'label',
    'error',
    'required',
    'class',
    'name',
    'value',
    'onInput',
    'onBlur',
    'ref',
  ]);

  return (
    <div class={cn('flex flex-col gap-1.5', local.class)}>
      <Show when={local.label}>
        <label
          for={local.name}
          class="text-sm font-medium text-gray-700 transition-colors"
        >
          {local.label}
          {local.required && <span class="ml-1 text-red-500">*</span>}
        </label>
      </Show>

      <textarea
        id={local.name}
        name={local.name}
        ref={local.ref}
        value={local.value || ''}
        onInput={(e) => local.onInput?.(e.currentTarget.value)}
        onBlur={(e) => local.onBlur?.(e)}
        class={cn(
          'w-full rounded-lg border px-3 py-2.5 text-sm transition-all duration-200',
          'bg-white text-gray-900 placeholder:text-gray-400',
          'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
          'hover:border-gray-400',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
          'resize-y',
          local.error
            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300'
        )}
        aria-invalid={!!local.error}
        aria-describedby={local.error ? `${local.name}-error` : undefined}
        {...others}
      />

      <Show when={local.error}>
        <div
          id={`${local.name}-error`}
          class="flex items-center gap-1 text-sm text-red-600"
          role="alert"
        >
          <svg
            class="h-4 w-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{local.error}</span>
        </div>
      </Show>
    </div>
  );
};
