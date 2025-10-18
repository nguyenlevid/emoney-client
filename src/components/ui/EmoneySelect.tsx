import type { Component } from 'solid-js';
import { For } from 'solid-js';

interface EmoneySelectProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  class?: string;
  label?: string;
  error?: string;
  onChange?: (value: string) => void;
}

export const EmoneySelect: Component<EmoneySelectProps> = (props) => {
  return (
    <div class={`space-y-2 ${props.class || ''}`}>
      {props.label && (
        <label class="block text-sm font-medium text-gray-700">
          {props.label}
          {props.required && <span class="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div class="group relative">
        <select
          value={props.value || ''}
          disabled={props.disabled}
          required={props.required}
          class={`w-full cursor-pointer rounded-lg border bg-white/85 px-3 py-2.5 pr-10 text-sm shadow-sm backdrop-blur-sm transition-all duration-300 ease-out ${!props.value && props.placeholder ? 'text-gray-500' : 'text-gray-900'} appearance-none hover:scale-[1.01] hover:bg-white hover:shadow-lg focus:scale-[1.01] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
            props.error
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onChange={(e) => props.onChange?.(e.currentTarget.value)}
        >
          {props.placeholder && (
            <option value="" disabled selected hidden class="text-gray-500">
              {props.placeholder}
            </option>
          )}

          <For each={props.options}>
            {(option) => (
              <option
                value={option.value}
                disabled={option.disabled}
                class="bg-white py-2 text-gray-900"
              >
                {option.label}
              </option>
            )}
          </For>
        </select>

        {/* Custom dropdown arrow with glow effect */}
        <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transform">
          <svg
            class="h-5 w-5 text-gray-500 transition-colors duration-300 group-hover:text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Subtle glow overlay on hover */}
        <div class="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50/50 via-transparent to-green-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {props.error && (
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
          <p class="text-sm text-red-600">{props.error}</p>
        </div>
      )}
    </div>
  );
};

export default EmoneySelect;
