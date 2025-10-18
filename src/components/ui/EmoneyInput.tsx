import type { Component, JSX } from 'solid-js';

interface EmoneyInputProps {
  type?:
    | 'text'
    | 'number'
    | 'email'
    | 'password'
    | 'search'
    | 'date'
    | 'time'
    | 'datetime-local';
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  class?: string;
  label?: string;
  error?: string;
  icon?: JSX.Element;
  inputMode?:
    | 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url';
  step?: string;
  min?: string;
  max?: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
}

export const EmoneyInput: Component<EmoneyInputProps> = (props) => {
  return (
    <div class={`space-y-2 ${props.class || ''}`}>
      {props.label && (
        <label class="block text-sm font-medium text-gray-700">
          {props.label}
          {props.required && <span class="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div class="group relative">
        {/* Icon container with glass effect */}
        {props.icon && (
          <div class="absolute left-3 top-1/2 z-10 -translate-y-1/2 transform text-gray-500 transition-colors duration-300 group-hover:text-blue-500">
            {props.icon}
          </div>
        )}

        <input
          type={props.type || 'text'}
          inputMode={props.inputMode}
          step={props.step}
          min={props.min}
          max={props.max}
          placeholder={props.placeholder}
          value={props.value || ''}
          disabled={props.disabled}
          required={props.required}
          class={`w-full rounded-lg border bg-white/85 px-3 py-2.5 text-sm text-gray-900 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out placeholder:text-gray-500 hover:scale-[1.01] hover:bg-white hover:shadow-lg focus:scale-[1.01] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${props.icon ? 'pl-10' : ''} ${
            props.error
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onInput={(e) => props.onInput?.(e.currentTarget.value)}
          onChange={(e) => props.onChange?.(e.currentTarget.value)}
        />

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

export default EmoneyInput;
