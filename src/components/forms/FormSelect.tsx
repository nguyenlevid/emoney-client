import type { Component } from 'solid-js';
import { Show, For, createSignal, createEffect, onCleanup } from 'solid-js';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps {
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
  tabIndex?: number;
  onChange?: (value: string) => void;
  onBlur?: (e: FocusEvent) => void;
  ref?: (element: HTMLDivElement) => void;
  searchable?: boolean;
}

export const FormSelect: Component<FormSelectProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [highlightedIndex, setHighlightedIndex] = createSignal(0);
  const [activeDescendant, setActiveDescendant] = createSignal<string>('');

  let containerRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;
  let listboxRef: HTMLUListElement | undefined;

  // Get selected option label
  const selectedLabel = () => {
    const option = props.options.find((opt) => opt.value === props.value);
    return option?.label || '';
  };

  // Filter options based on search query
  const filteredOptions = () => {
    if (!props.searchable) return props.options;
    const query = searchQuery().toLowerCase().trim();
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

  // Scroll highlighted option into view
  const scrollHighlightedIntoView = () => {
    const listbox = listboxRef;
    const highlighted = listbox?.children[highlightedIndex()] as HTMLElement;
    if (highlighted && listbox) {
      const listboxRect = listbox.getBoundingClientRect();
      const highlightedRect = highlighted.getBoundingClientRect();

      if (highlightedRect.bottom > listboxRect.bottom) {
        highlighted.scrollIntoView({ block: 'end', behavior: 'smooth' });
      } else if (highlightedRect.top < listboxRect.top) {
        highlighted.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    const filtered = filteredOptions();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = Math.min(prev + 1, filtered.length - 1);
          setActiveDescendant(`${props.name}-option-${next}`);
          return next;
        });
        scrollHighlightedIntoView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          setActiveDescendant(`${props.name}-option-${next}`);
          return next;
        });
        scrollHighlightedIntoView();
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen() && filtered.length > 0) {
          selectOption(filtered[highlightedIndex()].value);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'Tab':
        // Allow natural tab behavior, just close dropdown
        setIsOpen(false);
        setSearchQuery('');
        break;
      case ' ':
        if (!isOpen() && !props.searchable) {
          e.preventDefault();
          setIsOpen(true);
        }
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
      if (props.searchable) {
        window.setTimeout(() => inputRef?.focus(), 0);
      }
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
    setActiveDescendant(`${props.name}-option-0`);
  });

  return (
    <div class={cn('flex flex-col gap-1.5', props.class)} ref={containerRef}>
      <Show when={props.label}>
        <label
          for={props.name}
          class="text-sm font-medium text-gray-700 transition-colors"
        >
          {props.label}
          {props.required && <span class="ml-1 text-red-500">*</span>}
        </label>
      </Show>

      <div class="relative">
        {/* Main trigger button/input */}
        <div
          id={props.name}
          role="combobox"
          aria-expanded={isOpen()}
          aria-haspopup="listbox"
          aria-controls={`${props.name}-listbox`}
          aria-activedescendant={activeDescendant()}
          tabIndex={props.tabIndex ?? 0}
          class={cn(
            'flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all duration-200',
            'bg-white text-gray-900',
            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            'hover:border-gray-400',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            props.error
              ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300',
            props.disabled && 'pointer-events-none opacity-50'
          )}
          onClick={() => {
            if (!props.disabled) {
              // If already open (from focus), don't toggle
              if (!isOpen()) {
                setIsOpen(true);
              }
            }
          }}
          onFocus={() => {
            // Auto-open on focus for searchable dropdowns
            if (props.searchable && !props.disabled && !isOpen()) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={(e) => props.onBlur?.(e)}
        >
          <Show
            when={isOpen() && props.searchable}
            fallback={
              <span class={cn(!props.value && 'text-gray-400')}>
                {props.value
                  ? selectedLabel()
                  : props.placeholder || 'Select...'}
              </span>
            }
          >
            <input
              ref={inputRef}
              type="text"
              tabIndex={-1}
              class="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
              placeholder="Type to search..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
            />
          </Show>

          {/* Chevron icon */}
          <svg
            class={cn(
              'ml-2 h-4 w-4 flex-shrink-0 text-gray-500 transition-transform duration-200',
              isOpen() && 'rotate-180'
            )}
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

        {/* Search icon indicator (positioned absolutely on right side) */}
        <Show when={props.searchable && !isOpen()}>
          <div class="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2">
            <svg
              class="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </Show>

        {/* Dropdown listbox */}
        <Show when={isOpen()}>
          <ul
            id={`${props.name}-listbox`}
            ref={listboxRef}
            role="listbox"
            class={cn(
              'absolute z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300',
              'bg-white shadow-2xl ring-1 ring-black ring-opacity-10',
              'scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300'
            )}
            style={{
              'box-shadow':
                '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Show
              when={filteredOptions().length > 0}
              fallback={
                <li class="px-3 py-2 text-sm text-gray-500">
                  No options found
                </li>
              }
            >
              <For each={filteredOptions()}>
                {(option, index) => (
                  <li
                    id={`${props.name}-option-${index()}`}
                    role="option"
                    aria-selected={option.value === props.value}
                    class={cn(
                      'cursor-pointer px-3 py-2 text-sm transition-colors',
                      'hover:bg-blue-50',
                      highlightedIndex() === index() && 'bg-blue-50',
                      option.value === props.value && 'bg-blue-100 font-medium',
                      option.disabled && 'cursor-not-allowed opacity-50'
                    )}
                    onClick={() =>
                      !option.disabled && selectOption(option.value)
                    }
                    onMouseEnter={() => setHighlightedIndex(index())}
                  >
                    <div class="flex items-center justify-between">
                      <span>{option.label}</span>
                      <Show when={option.value === props.value}>
                        <svg
                          class="h-4 w-4 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </Show>
                    </div>
                  </li>
                )}
              </For>
            </Show>
          </ul>
        </Show>
      </div>

      <Show when={props.error}>
        <div
          id={`${props.name}-error`}
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
          <span>{props.error}</span>
        </div>
      </Show>
    </div>
  );
};
