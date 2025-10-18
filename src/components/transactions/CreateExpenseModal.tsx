import { createSignal, Show } from 'solid-js';
import { createQuery } from '@tanstack/solid-query';
import { Modal } from '@/components/ui/Modal';
import { KobalteButton } from '@/components/ui/KobalteButton';
import { EmoneyInput } from '@/components/ui/EmoneyInput';
import { EmoneySelect } from '@/components/ui/EmoneySelect';
import { apiClient } from '@/lib/api/client';
import { authStore } from '@/lib/auth/authStore';
import { toastStore } from '@/lib/stores/toastStore';
import type { CreateExpenseTransactionRequest } from '@/types';

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateExpenseModal = (props: CreateExpenseModalProps) => {
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [amountInput, setAmountInput] = createSignal(''); // Store raw input to preserve decimal point
  const [formData, setFormData] = createSignal<
    Partial<CreateExpenseTransactionRequest>
  >({
    date: new Date().toISOString().split('T')[0], // Default to today
    description: '',
    amount: 0,
    expenseAccountId: '',
    payableAccountId: '',
    reference: '',
    notes: '',
  });

  // Fetch accounts for dropdowns
  const accountsQuery = createQuery(() => ({
    queryKey: ['accounts', authStore.selectedCompany?._id],
    queryFn: () =>
      authStore.selectedCompany
        ? apiClient.getAccounts(authStore.selectedCompany._id)
        : Promise.resolve([]),
    enabled: !!authStore.selectedCompany && props.isOpen,
  }));

  // Filter accounts by type
  const expenseAccounts = () =>
    (accountsQuery.data || []).filter((acc) => acc.accountType === 'EXPENSE');

  const paymentAccounts = () =>
    (accountsQuery.data || []).filter(
      (acc) => acc.accountType === 'ASSET' || acc.accountType === 'LIABILITY'
    );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!authStore.selectedCompany) {
      toastStore.error('No company selected');
      return;
    }

    const data = formData();

    // Validation
    if (!data.description?.trim()) {
      toastStore.error('Please enter a description');
      return;
    }

    if (!data.amount || data.amount <= 0) {
      toastStore.error('Please enter a valid amount');
      return;
    }

    if (!data.expenseAccountId) {
      toastStore.error('Please select an expense category');
      return;
    }

    if (!data.payableAccountId) {
      toastStore.error('Please select a payment account');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.createExpenseTransaction({
        companyId: authStore.selectedCompany._id,
        description: data.description!,
        date: data.date!,
        amount: data.amount!,
        expenseAccountId: data.expenseAccountId!,
        payableAccountId: data.payableAccountId!,
        reference: data.reference,
        notes: data.notes,
      });

      toastStore.success('Expense recorded successfully!');

      // Reset form
      setAmountInput('');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        expenseAccountId: '',
        payableAccountId: '',
        reference: '',
        notes: '',
      });

      props.onSuccess();
      props.onClose();
    } catch (error) {
      console.error('Failed to create expense:', error);
      toastStore.error(
        error instanceof Error ? error.message : 'Failed to create expense'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting()) {
      props.onClose();
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="💸 Record an Expense"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} class="space-y-4">
        {/* Description */}
        <EmoneyInput
          label="What did you spend money on? *"
          type="text"
          placeholder="e.g., Dinner with client, Office supplies"
          value={formData().description || ''}
          onInput={(value) =>
            setFormData({ ...formData(), description: value })
          }
          required
        />

        {/* Amount */}
        <EmoneyInput
          label="How much? *"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amountInput()}
          onInput={(value) => {
            // Allow numbers and decimals only
            const numValue = value.replace(/[^0-9.]/g, '');
            // Prevent multiple decimal points
            const parts = numValue.split('.');
            const sanitized =
              parts.length > 2
                ? parts[0] + '.' + parts.slice(1).join('')
                : numValue;
            // Store the string value to preserve decimal point while typing
            setAmountInput(sanitized);
            // Update the amount for validation/submission
            setFormData({
              ...formData(),
              amount: sanitized ? parseFloat(sanitized) : 0,
            });
          }}
          required
        />

        {/* Expense Category */}
        <div>
          <EmoneySelect
            label="Category *"
            placeholder="Select expense category"
            value={formData().expenseAccountId || ''}
            options={expenseAccounts().map((acc) => ({
              value: acc._id,
              label: `${acc.code} - ${acc.name}`,
            }))}
            onChange={(value) =>
              setFormData({ ...formData(), expenseAccountId: value })
            }
            required
          />
          <Show
            when={expenseAccounts().length === 0 && !accountsQuery.isLoading}
          >
            <p class="mt-1 text-xs text-yellow-600">
              No expense accounts found. Please create expense accounts first.
            </p>
          </Show>
        </div>

        {/* Payment Account */}
        <EmoneySelect
          label="Paid from *"
          placeholder="Select payment account"
          value={formData().payableAccountId || ''}
          options={paymentAccounts().map((acc) => ({
            value: acc._id,
            label: `${acc.code} - ${acc.name}`,
          }))}
          onChange={(value) =>
            setFormData({ ...formData(), payableAccountId: value })
          }
          required
        />

        {/* Date */}
        <EmoneyInput
          label="Date *"
          type="date"
          value={formData().date || ''}
          onInput={(value) => setFormData({ ...formData(), date: value })}
          required
        />

        {/* Reference (Optional) */}
        <EmoneyInput
          label="Receipt/Reference (optional)"
          type="text"
          placeholder="e.g., Receipt #123"
          value={formData().reference || ''}
          onInput={(value) => setFormData({ ...formData(), reference: value })}
        />

        {/* Notes (Optional) */}
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            rows="2"
            placeholder="Add any additional notes..."
            value={formData().notes || ''}
            onInput={(e) =>
              setFormData({ ...formData(), notes: e.currentTarget.value })
            }
          />
        </div>

        {/* Footer Buttons */}
        <div class="flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <KobalteButton
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting()}
          >
            Cancel
          </KobalteButton>
          <KobalteButton
            type="submit"
            disabled={isSubmitting() || accountsQuery.isLoading}
          >
            <Show when={isSubmitting()} fallback="Record Expense">
              <span class="flex items-center">
                <svg
                  class="mr-2 h-4 w-4 animate-spin"
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
                Recording...
              </span>
            </Show>
          </KobalteButton>
        </div>
      </form>
    </Modal>
  );
};
