import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: JSX.Element;
  class?: string;
}

export function FormField(props: FormFieldProps) {
  const [local] = splitProps(props, [
    'label',
    'error',
    'required',
    'children',
    'class',
  ]);

  return (
    <div class={`form-field ${local.class || ''}`}>
      {local.label && (
        <label class="form-label">
          {local.label}
          {local.required && <span class="text-red-500">*</span>}
        </label>
      )}
      {local.children}
      {local.error && <span class="form-error">{local.error}</span>}
    </div>
  );
}
