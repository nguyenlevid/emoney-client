import { createSignal, Show, For, createEffect } from 'solid-js';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import type { Account, AccountType, UpdateAccountRequest } from '@/types';
import { authStore } from '@/lib/auth/authStore';
import { apiClient } from '@/lib/api/client';

interface EditAccountModalProps {
  isOpen: boolean;
  account: Account | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAccountModal(props: EditAccountModalProps) {
  const [formData, setFormData] = createSignal<Partial<UpdateAccountRequest>>(
    {}
  );
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const accountTypes: {
    value: AccountType;
    label: string;
    subtypes: string[];
  }[] = [
    {
      value: 'ASSET',
      label: 'Asset',
      subtypes: ['Current Asset', 'Fixed Asset', 'Other Asset'],
    },
    {
      value: 'LIABILITY',
      label: 'Liability',
      subtypes: ['Current Liability', 'Long-term Liability', 'Other Liability'],
    },
    {
      value: 'EQUITY',
      label: 'Equity',
      subtypes: ['Owner Equity', 'Retained Earnings', 'Common Stock'],
    },
    {
      value: 'REVENUE',
      label: 'Revenue',
      subtypes: ['Operating Revenue', 'Other Revenue'],
    },
    {
      value: 'EXPENSE',
      label: 'Expense',
      subtypes: ['Operating Expense', 'Cost of Goods Sold', 'Other Expense'],
    },
  ];

  const selectedAccountType = () =>
    accountTypes.find((type) => type.value === formData().accountType) ||
    accountTypes[0];

  // Initialize form data when account changes
  createEffect(() => {
    if (props.account) {
      setFormData({
        code: props.account.code,
        name: props.account.name,
        accountType: props.account.accountType,
        subType: props.account.subType,
        description: props.account.description || '',
        isActive: props.account.isActive,
      });
      setErrors({});
    }
  });

  const updateFormData = (
    field: keyof UpdateAccountRequest,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors()[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const data = formData();

    if (!data.code?.trim()) {
      newErrors.code = 'Account code is required';
    }
    if (!data.name?.trim()) {
      newErrors.name = 'Account name is required';
    }
    if (!data.accountType) {
      newErrors.accountType = 'Account type is required';
    }
    if (!data.subType?.trim()) {
      newErrors.subType = 'Sub-type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validateForm() || !props.account) return;
    if (!authStore.selectedCompany) return;

    setIsSubmitting(true);
    try {
      const requestData: UpdateAccountRequest = {
        ...(formData() as UpdateAccountRequest),
        companyId: authStore.selectedCompany._id,
      };

      await apiClient.updateAccount(props.account._id, requestData);
      props.onSuccess();
      resetForm();
    } catch {
      setErrors({ submit: 'Failed to update account. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({});
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    props.onClose();
  };

  return (
    <Show when={props.isOpen && props.account}>
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white">
          <form onSubmit={handleSubmit} class="space-y-4 p-6">
            <div class="mb-6 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Edit Account</h3>
              <button
                type="button"
                onClick={handleClose}
                class="text-gray-400 hover:text-gray-600"
              >
                <svg
                  class="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <Show when={errors().submit}>
              <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors().submit}
              </div>
            </Show>

            <FormField label="Account Code" required error={errors().code}>
              <Input
                type="text"
                placeholder="e.g., 1000"
                value={formData().code || ''}
                onInput={(e) => updateFormData('code', e.currentTarget.value)}
                error={errors().code}
                disabled={props.account?.isSystem}
              />
              <Show when={props.account?.isSystem}>
                <p class="mt-1 text-xs text-gray-500">
                  System account codes cannot be modified
                </p>
              </Show>
            </FormField>

            <FormField label="Account Name" required error={errors().name}>
              <Input
                type="text"
                placeholder="e.g., Cash in Bank"
                value={formData().name || ''}
                onInput={(e) => updateFormData('name', e.currentTarget.value)}
                error={errors().name}
              />
            </FormField>

            <FormField
              label="Account Type"
              required
              error={errors().accountType}
            >
              <select
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                value={formData().accountType || 'ASSET'}
                disabled={props.account?.isSystem}
                onChange={(e) => {
                  updateFormData(
                    'accountType',
                    e.currentTarget.value as AccountType
                  );
                  // Reset subtype when account type changes
                  setFormData((prev) => ({ ...prev, subType: '' }));
                }}
              >
                <For each={accountTypes}>
                  {(type) => <option value={type.value}>{type.label}</option>}
                </For>
              </select>
              <Show when={props.account?.isSystem}>
                <p class="mt-1 text-xs text-gray-500">
                  System account type cannot be changed
                </p>
              </Show>
            </FormField>

            <FormField label="Sub Type" required error={errors().subType}>
              <select
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData().subType || ''}
                onChange={(e) =>
                  updateFormData('subType', e.currentTarget.value)
                }
              >
                <option value="">Select a sub-type</option>
                <For each={selectedAccountType().subtypes}>
                  {(subtype) => <option value={subtype}>{subtype}</option>}
                </For>
              </select>
            </FormField>

            <FormField label="Description" error={errors().description}>
              <textarea
                class="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Optional description..."
                value={formData().description || ''}
                onInput={(e) =>
                  updateFormData('description', e.currentTarget.value)
                }
              />
            </FormField>

            <Show when={!props.account?.isSystem}>
              <FormField label="Status">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData().isActive !== false}
                    onChange={(e) =>
                      updateFormData('isActive', e.currentTarget.checked)
                    }
                    class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span class="ml-2 text-sm text-gray-700">
                    Account is active
                  </span>
                </label>
              </FormField>
            </Show>

            <div class="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting()}
                class="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting()} class="flex-1">
                <Show when={isSubmitting()}>
                  <svg
                    class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </Show>
                Update Account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
}
