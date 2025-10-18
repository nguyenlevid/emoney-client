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

  return (
    <div class="w-full space-y-2">
      {local.label && (
        <label class="block text-sm font-medium text-gray-700">
          {local.label}
        </label>
      )}

      <div class="group relative">
        <input
          class={cn(
            'w-full rounded-glass border bg-white/85 px-3 py-2.5 text-sm backdrop-blur-glass',
            'shadow-sm transition-all duration-300 ease-out',
            'placeholder:text-gray-400',
            'hover:scale-[1.01] hover:bg-white hover:shadow-lg',
            'focus:scale-[1.01] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
            local.error
              ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 hover:border-blue-400',
            local.class
          )}
          {...others}
        />

        {/* Subtle glow overlay on hover */}
        <div class="pointer-events-none absolute inset-0 rounded-glass bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {local.error && (
        <div class="flex items-center gap-1">
          <svg
            class="h-4 w-4 text-red-500"
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
          <p class="text-sm text-red-600">{local.error}</p>
        </div>
      )}

      {local.helperText && !local.error && (
        <p class="text-sm text-gray-600">{local.helperText}</p>
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

  return (
    <div class="w-full space-y-2">
      {local.label && (
        <label class="block text-sm font-medium text-gray-700">
          {local.label}
        </label>
      )}

      <div class="group relative">
        <textarea
          class={cn(
            'min-h-[80px] w-full rounded-glass border bg-white/85 px-3 py-2.5 text-sm backdrop-blur-glass',
            'resize-none shadow-sm transition-all duration-300 ease-out',
            'placeholder:text-gray-400',
            'hover:scale-[1.01] hover:bg-white hover:shadow-lg',
            'focus:scale-[1.01] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
            local.error
              ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 hover:border-blue-400',
            local.class
          )}
          {...others}
        />

        {/* Subtle glow overlay on hover */}
        <div class="pointer-events-none absolute inset-0 rounded-glass bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {local.error && (
        <div class="flex items-center gap-1">
          <svg
            class="h-4 w-4 text-red-500"
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
          <p class="text-sm text-red-600">{local.error}</p>
        </div>
      )}

      {local.helperText && !local.error && (
        <p class="text-sm text-gray-600">{local.helperText}</p>
      )}
    </div>
  );
}
