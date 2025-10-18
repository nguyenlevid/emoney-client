import type { Component } from 'solid-js';
import { splitProps, For } from 'solid-js';
import { RadioGroup } from '@kobalte/core/radio-group';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface KobalteRadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  orientation?: 'horizontal' | 'vertical';
  options: RadioOption[];
  class?: string;
  label?: string;
  errorMessage?: string;
  onChange?: (value: string) => void;
}

export const KobalteRadioGroup: Component<KobalteRadioGroupProps> = (props) => {
  const [local, others] = splitProps(props, [
    'name',
    'value',
    'defaultValue',
    'disabled',
    'required',
    'orientation',
    'options',
    'class',
    'label',
    'errorMessage',
    'onChange',
  ]);

  return (
    <div class={`space-y-2 ${local.class || ''}`}>
      <RadioGroup
        name={local.name}
        value={local.value}
        defaultValue={local.defaultValue}
        disabled={local.disabled}
        required={local.required}
        orientation={local.orientation || 'vertical'}
        onChange={local.onChange}
        {...others}
      >
        {local.label && (
          <RadioGroup.Label class="mb-2 block text-sm font-medium text-gray-700">
            {local.label}
            {local.required && <span class="ml-1 text-red-500">*</span>}
          </RadioGroup.Label>
        )}

        <div
          class={`space-y-2 ${local.orientation === 'horizontal' ? 'flex space-x-4 space-y-0' : ''}`}
        >
          <For each={local.options}>
            {(option) => (
              <RadioGroup.Item
                value={option.value}
                disabled={option.disabled}
                class="flex cursor-pointer items-center space-x-2"
              >
                <RadioGroup.ItemInput class="sr-only" />
                <RadioGroup.ItemControl class="flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-50 data-[checked]:border-blue-600 data-[checked]:bg-blue-600">
                  <RadioGroup.ItemIndicator class="h-2 w-2 rounded-full bg-white" />
                </RadioGroup.ItemControl>
                <RadioGroup.ItemLabel class="cursor-pointer select-none text-sm text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400">
                  {option.label}
                </RadioGroup.ItemLabel>
              </RadioGroup.Item>
            )}
          </For>
        </div>

        {local.errorMessage && (
          <RadioGroup.ErrorMessage class="mt-1 text-sm text-red-600">
            {local.errorMessage}
          </RadioGroup.ErrorMessage>
        )}
      </RadioGroup>
    </div>
  );
};

export default KobalteRadioGroup;
