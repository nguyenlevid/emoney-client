import type { Component } from 'solid-js';
import { splitProps } from 'solid-js';
import { TextField } from '@kobalte/core/text-field';

interface KobalteInputProps {
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'date'
    | 'time'
    | 'datetime-local'
    | 'search';
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  class?: string;
  label?: string;
  error?: string;
  description?: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
}

export const KobalteInput: Component<KobalteInputProps> = (props) => {
  const [local] = splitProps(props, [
    'type',
    'value',
    'placeholder',
    'disabled',
    'required',
    'class',
    'label',
    'error',
    'description',
    'onInput',
    'onChange',
  ]);

  return (
    <div class={`space-y-2 ${local.class || ''}`}>
      <TextField
        value={local.value}
        onChange={local.onChange}
        disabled={local.disabled}
        required={local.required}
        validationState={local.error ? 'invalid' : 'valid'}
      >
        {local.label && (
          <TextField.Label class="block text-sm font-medium text-gray-700">
            {local.label}
            {local.required && <span class="ml-1 text-red-500">*</span>}
          </TextField.Label>
        )}

        {local.description && (
          <TextField.Description class="text-sm text-gray-600">
            {local.description}
          </TextField.Description>
        )}

        <div class="group relative">
          <TextField.Input
            type={local.type || 'text'}
            placeholder={local.placeholder}
            onInput={(e) => local.onInput?.(e.currentTarget.value)}
            class={`w-full rounded-lg border bg-white/85 px-3 py-2.5 text-sm text-gray-900 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out placeholder:text-gray-500 hover:scale-[1.01] hover:bg-white hover:shadow-lg focus:scale-[1.01] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
              local.error
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          />

          {/* Subtle glow overlay on hover */}
          <div class="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50/50 via-transparent to-green-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {local.error && (
          <TextField.ErrorMessage class="flex items-center gap-1 text-sm text-red-600">
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
            {local.error}
          </TextField.ErrorMessage>
        )}
      </TextField>
    </div>
  );
};

export default KobalteInput;
