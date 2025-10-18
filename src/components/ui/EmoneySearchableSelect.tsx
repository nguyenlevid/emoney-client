import type { Component } from 'solid-js';
import { createSignal, createEffect, For, Show, onCleanup } from 'solid-js';

interface EmoneySearchableSelectProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  class?: string;
  label?: string;
  error?: string;
  tabIndex?: number;
  onChange?: (value: string) => void;
}

export const EmoneySearchableSelect: Component<EmoneySearchableSelectProps> = (
  props
) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [highlightedIndex, setHighlightedIndex] = createSignal(0);
  let containerRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;

  // Get selected option label
  const selectedLabel = () => {
    const option = props.options.find((opt) => opt.value === props.value);
    return option?.label || '';
  };

  // Filter options based on search query
  const filteredOptions = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return props.options;
    return props.options.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  };

  // Handle option selection
  const selectOption = (value: string) => {
    props.onChange?.(value);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    const filtered = filteredOptions();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered.length > 0) {
          selectOption(filtered[highlightedIndex()].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  createEffect(() => {
    if (isOpen()) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus input when dropdown opens
      window.setTimeout(() => inputRef?.focus(), 0);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside);
    });
  });

  // Reset highlighted index when search changes
  createEffect(() => {
    searchQuery();
    setHighlightedIndex(0);
  });

  return (
    <div class={`relative space-y-2 ${props.class || ''}`} ref={containerRef}>
      {props.label && (
        <label class="block text-sm font-medium text-gray-700">
          {props.label}
          {props.required && <span class="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div class="group relative">
        {/* Selected value display / Search input */}
        <div
          tabIndex={props.tabIndex}
          class={`w-full cursor-pointer rounded-lg border bg-white/85 px-3 py-2.5 pr-10 text-sm shadow-sm backdrop-blur-sm transition-all duration-300 ease-out ${
            !props.value && props.placeholder
              ? 'text-gray-500'
              : 'text-gray-900'
          } focus-within:scale-[1.01] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 hover:scale-[1.01] hover:bg-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
            props.error
              ? 'border-red-300 bg-red-50 focus-within:border-red-500 focus-within:ring-red-500/20'
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onClick={() => !props.disabled && setIsOpen(!isOpen())}
          onFocus={() => !props.disabled && !isOpen() && setIsOpen(true)}
        >
          <Show
            when={isOpen()}
            fallback={
              <div class="truncate">
                {props.value
                  ? selectedLabel()
                  : props.placeholder || 'Select...'}
              </div>
            }
          >
            <input
              ref={inputRef}
              type="text"
              tabIndex={-1}
              class="w-full bg-transparent outline-none"
              placeholder="Type to search..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              disabled={props.disabled}
            />
          </Show>
        </div>

        {/* Dropdown arrow */}
        <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transform">
          <svg
            class={`h-5 w-5 text-gray-500 transition-all duration-300 group-hover:text-blue-500 ${
              isOpen() ? 'rotate-180' : ''
            }`}
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

        {/* Dropdown menu */}
        <Show when={isOpen() && !props.disabled}>
          <div class="absolute z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-2xl">
            <Show
              when={filteredOptions().length > 0}
              fallback={
                <div class="px-3 py-2 text-center text-sm text-gray-500">
                  No options found
                </div>
              }
            >
              <For each={filteredOptions()}>
                {(option, index) => (
                  <div
                    class={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                      index() === highlightedIndex()
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-900 hover:bg-gray-50'
                    } ${option.disabled ? 'cursor-not-allowed opacity-50' : ''} ${
                      props.value === option.value
                        ? 'bg-blue-100 font-medium'
                        : ''
                    }`}
                    onClick={() =>
                      !option.disabled && selectOption(option.value)
                    }
                    onMouseEnter={() => setHighlightedIndex(index())}
                  >
                    {option.label}
                  </div>
                )}
              </For>
            </Show>
          </div>
        </Show>

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

export default EmoneySearchableSelect;
