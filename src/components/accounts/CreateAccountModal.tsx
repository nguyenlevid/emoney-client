import { createSignal, Show } from 'solid-js';
import { Modal } from '@/components/ui/Modal';
import { EmoneyInput } from '@/components/ui/EmoneyInput';
import { EmoneySelect } from '@/components/ui/EmoneySelect';
import { EmoneyTextarea } from '@/components/ui/EmoneyTextarea';
import { KobalteButton } from '@/components/ui/KobalteButton';
import type { AccountType, CreateAccountRequest } from '@/types';
import { authStore } from '@/lib/auth/authStore';
import { apiClient } from '@/lib/api/client';
import { toastStore } from '@/lib/stores/toastStore';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAccountModal(props: CreateAccountModalProps) {
  const [formData, setFormData] = createSignal<Partial<CreateAccountRequest>>({
    code: '',
    name: '',
    accountType: 'ASSET',
    subType: '',
    description: '',
  });

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

  const updateFormData = (field: keyof CreateAccountRequest, value: string) => {
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

    if (!validateForm()) return;
    if (!authStore.selectedCompany) {
      toastStore.error('No company selected');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData: CreateAccountRequest = {
        ...(formData() as CreateAccountRequest),
        companyId: authStore.selectedCompany._id,
      };

      await apiClient.createAccount(requestData);
      toastStore.success('Account created successfully!');
      props.onSuccess();
      resetForm();
      props.onClose();
    } catch (error) {
      console.error('Failed to create account:', error);
      toastStore.error(
        error instanceof Error ? error.message : 'Failed to create account'
      );
      setErrors({ submit: 'Failed to create account. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      accountType: 'ASSET',
      subType: '',
      description: '',
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!isSubmitting()) {
      resetForm();
      props.onClose();
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="💼 Create New Account"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} class="space-y-4">
        <Show when={errors().submit}>
          <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors().submit}
          </div>
        </Show>

        {/* Account Code */}
        <EmoneyInput
          label="Account Code"
          type="text"
          placeholder="e.g., 1110 (US GAAP: 1000-1999 Assets, 2000-2999 Liabilities, 3000-3999 Equity, 4000-4999 Revenue, 5000-5999 Expenses)"
          value={formData().code || ''}
          onInput={(value) => updateFormData('code', value)}
          error={errors().code}
          required
        />

        {/* Account Name */}
        <EmoneyInput
          label="Account Name"
          type="text"
          placeholder="e.g., Cash in Bank"
          value={formData().name || ''}
          onInput={(value) => updateFormData('name', value)}
          error={errors().name}
          required
        />

        {/* Account Type */}
        <EmoneySelect
          label="Account Type"
          placeholder="Select account type"
          value={formData().accountType || 'ASSET'}
          options={accountTypes.map((type) => ({
            value: type.value,
            label: type.label,
          }))}
          onChange={(value) => {
            updateFormData('accountType', value as AccountType);
            // Reset subtype when account type changes
            setFormData((prev) => ({ ...prev, subType: '' }));
          }}
          required
        />

        {/* Sub Type */}
        <EmoneySelect
          label="Sub Type"
          placeholder="Select a sub-type"
          value={formData().subType || ''}
          options={selectedAccountType().subtypes.map((subtype) => ({
            value: subtype,
            label: subtype,
          }))}
          onChange={(value) => updateFormData('subType', value)}
          error={errors().subType}
          required
        />

        {/* Description */}
        <EmoneyTextarea
          label="Description"
          placeholder="Optional description..."
          value={formData().description || ''}
          onInput={(value) => updateFormData('description', value)}
          rows={3}
        />

        {/* Action Buttons */}
        <div class="flex justify-end space-x-3 pt-4">
          <KobalteButton
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting()}
          >
            Cancel
          </KobalteButton>
          <KobalteButton type="submit" disabled={isSubmitting()}>
            {isSubmitting() ? 'Creating...' : 'Create Account'}
          </KobalteButton>
        </div>
      </form>
    </Modal>
  );
}
