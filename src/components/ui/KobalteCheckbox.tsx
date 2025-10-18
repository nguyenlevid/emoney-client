import type { Component } from 'solid-js';
import { splitProps } from 'solid-js';
import { Checkbox } from '@kobalte/core/checkbox';

interface KobalteCheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  class?: string;
  label?: string;
  description?: string;
  errorMessage?: string;
  onChange?: (checked: boolean) => void;
}

export const KobalteCheckbox: Component<KobalteCheckboxProps> = (props) => {
  const [local, others] = splitProps(props, [
    'checked',
    'defaultChecked',
    'indeterminate',
    'disabled',
    'required',
    'name',
    'value',
    'class',
    'label',
    'description',
    'errorMessage',
    'onChange',
  ]);

  return (
    <div class={`space-y-2 ${local.class || ''}`}>
      <Checkbox
        checked={local.checked}
        defaultChecked={local.defaultChecked}
        indeterminate={local.indeterminate}
        disabled={local.disabled}
        required={local.required}
        name={local.name}
        value={local.value}
        onChange={local.onChange}
        {...others}
      >
        <div class="flex items-center space-x-3">
          <Checkbox.Input class="sr-only" />
          <Checkbox.Control class="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-50 data-[checked]:border-blue-600 data-[indeterminate]:border-blue-600 data-[checked]:bg-blue-600 data-[indeterminate]:bg-blue-600">
            <Checkbox.Indicator class="text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="h-3 w-3"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clip-rule="evenodd"
                />
              </svg>
            </Checkbox.Indicator>
          </Checkbox.Control>

          {local.label && (
            <div class="flex flex-col">
              <Checkbox.Label class="cursor-pointer select-none text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400">
                {local.label}
                {local.required && <span class="ml-1 text-red-500">*</span>}
              </Checkbox.Label>
              {local.description && (
                <Checkbox.Description class="mt-0.5 text-sm text-gray-500">
                  {local.description}
                </Checkbox.Description>
              )}
            </div>
          )}
        </div>

        {local.errorMessage && (
          <Checkbox.ErrorMessage class="mt-1 text-sm text-red-600">
            {local.errorMessage}
          </Checkbox.ErrorMessage>
        )}
      </Checkbox>
    </div>
  );
};

export default KobalteCheckbox;
