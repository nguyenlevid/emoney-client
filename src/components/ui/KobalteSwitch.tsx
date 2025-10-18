import type { Component } from 'solid-js';
import { splitProps } from 'solid-js';
import { Switch } from '@kobalte/core/switch';

interface KobalteSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  class?: string;
  label?: string;
  description?: string;
  errorMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (checked: boolean) => void;
}

export const KobalteSwitch: Component<KobalteSwitchProps> = (props) => {
  const [local, others] = splitProps(props, [
    'checked',
    'defaultChecked',
    'disabled',
    'required',
    'name',
    'value',
    'class',
    'label',
    'description',
    'errorMessage',
    'size',
    'onChange',
  ]);

  const sizeClasses = () => {
    switch (local.size) {
      case 'sm':
        return {
          track: 'h-4 w-7',
          thumb: 'h-3 w-3',
          translate: 'data-[checked]:translate-x-3',
        };
      case 'lg':
        return {
          track: 'h-7 w-12',
          thumb: 'h-6 w-6',
          translate: 'data-[checked]:translate-x-5',
        };
      default:
        return {
          track: 'h-5 w-9',
          thumb: 'h-4 w-4',
          translate: 'data-[checked]:translate-x-4',
        };
    }
  };

  return (
    <div class={`space-y-2 ${local.class || ''}`}>
      <Switch
        checked={local.checked}
        defaultChecked={local.defaultChecked}
        disabled={local.disabled}
        required={local.required}
        name={local.name}
        value={local.value}
        onChange={local.onChange}
        {...others}
      >
        <div class="flex items-center justify-between">
          {local.label && (
            <div class="mr-4 flex flex-1 flex-col">
              <Switch.Label class="cursor-pointer select-none text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400">
                {local.label}
                {local.required && <span class="ml-1 text-red-500">*</span>}
              </Switch.Label>
              {local.description && (
                <Switch.Description class="mt-0.5 text-sm text-gray-500">
                  {local.description}
                </Switch.Description>
              )}
            </div>
          )}

          <div class="flex items-center">
            <Switch.Input class="sr-only" />
            <Switch.Control
              class={`${sizeClasses().track} relative inline-flex items-center rounded-full bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-50 data-[checked]:bg-blue-600`}
            >
              <Switch.Thumb
                class={`${sizeClasses().thumb} ${sizeClasses().translate} inline-block translate-x-0.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out`}
              />
            </Switch.Control>
          </div>
        </div>

        {local.errorMessage && (
          <Switch.ErrorMessage class="mt-1 text-sm text-red-600">
            {local.errorMessage}
          </Switch.ErrorMessage>
        )}
      </Switch>
    </div>
  );
};

export default KobalteSwitch;
