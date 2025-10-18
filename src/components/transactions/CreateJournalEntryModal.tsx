import { createSignal, Show, For, createMemo } from 'solid-js';
import { createQuery } from '@tanstack/solid-query';
import { Modal } from '@/components/ui/Modal';
import { KobalteButton } from '@/components/ui/KobalteButton';
import { EmoneyInput } from '@/components/ui/EmoneyInput';
import { EmoneySelect } from '@/components/ui/EmoneySelect';
import { EmoneyTextarea } from '@/components/ui/EmoneyTextarea';
import { apiClient } from '@/lib/api/client';
import { authStore } from '@/lib/auth/authStore';
import { toastStore } from '@/lib/stores/toastStore';
import type { CreateTransactionRequest, TransactionEntry } from '@/types';

interface CreateJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface JournalEntryLine {
  id: number;
  accountId: string;
  description: string;
  debitAmount: string;
  creditAmount: string;
}

export const CreateJournalEntryModal = (
  props: CreateJournalEntryModalProps
) => {
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [nextId, setNextId] = createSignal(2); // Start at 2 since we have 2 initial lines

  const [formData, setFormData] = createSignal({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    notes: '',
  });

  // Initialize with 2 empty lines (minimum for double-entry)
  const [entries, setEntries] = createSignal<JournalEntryLine[]>([
    {
      id: 0,
      accountId: '',
      description: '',
      debitAmount: '',
      creditAmount: '',
    },
    {
      id: 1,
      accountId: '',
      description: '',
      debitAmount: '',
      creditAmount: '',
    },
  ]);

  // Fetch accounts for dropdowns
  const accountsQuery = createQuery(() => ({
    queryKey: ['accounts', authStore.selectedCompany?._id] as const,
    queryFn: async () => {
      if (!authStore.selectedCompany) return [];
      return apiClient.getAccounts(authStore.selectedCompany._id);
    },
    enabled: !!authStore.selectedCompany && props.isOpen,
  }));

  // Calculate totals
  const totalDebit = createMemo(() => {
    return entries().reduce((sum, entry) => {
      const amount = parseFloat(entry.debitAmount) || 0;
      return sum + amount;
    }, 0);
  });

  const totalCredit = createMemo(() => {
    return entries().reduce((sum, entry) => {
      const amount = parseFloat(entry.creditAmount) || 0;
      return sum + amount;
    }, 0);
  });

  const difference = createMemo(() => totalDebit() - totalCredit());
  const isBalanced = createMemo(() => Math.abs(difference()) < 0.01); // Allow for rounding errors

  // Update entry field
  const updateEntry = (
    id: number,
    field: keyof JournalEntryLine,
    value: string
  ) => {
    setEntries(
      entries().map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  // Update debit/credit amount with validation (no auto-clear, user manages debit vs credit)
  const updateAmount = (
    id: number,
    field: 'debitAmount' | 'creditAmount',
    value: string
  ) => {
    // Allow numbers and decimals only
    const numValue = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = numValue.split('.');
    const sanitized =
      parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numValue;

    setEntries(
      entries().map((entry) =>
        entry.id === id ? { ...entry, [field]: sanitized } : entry
      )
    );
  };

  // Add new line
  const addLine = () => {
    const id = nextId();
    setEntries([
      ...entries(),
      {
        id,
        accountId: '',
        description: '',
        debitAmount: '',
        creditAmount: '',
      },
    ]);
    setNextId(id + 1);
  };

  // Remove line (minimum 2 lines required)
  const removeLine = (id: number) => {
    if (entries().length <= 2) {
      toastStore.error('Minimum 2 lines required for journal entry');
      return;
    }
    setEntries(entries().filter((entry) => entry.id !== id));
  };

  const validateForm = (): boolean => {
    const data = formData();

    if (!data.description?.trim()) {
      toastStore.error('Please enter a description');
      return false;
    }

    // Check if at least 2 entries have accounts selected
    const validEntries = entries().filter(
      (e) => e.accountId && (e.debitAmount || e.creditAmount)
    );
    if (validEntries.length < 2) {
      toastStore.error('At least 2 journal entries are required');
      return false;
    }

    // Check that no entry has both debit AND credit (accounting rule violation)
    const hasDoubleEntry = entries().some((e) => {
      const hasDebit = e.debitAmount && parseFloat(e.debitAmount) > 0;
      const hasCredit = e.creditAmount && parseFloat(e.creditAmount) > 0;
      return hasDebit && hasCredit;
    });
    if (hasDoubleEntry) {
      toastStore.error('Each line can have either a debit OR credit, not both');
      return false;
    }

    // Check if entries are balanced
    if (!isBalanced()) {
      toastStore.error(
        `Debits and credits must be equal. Difference: ${formatCurrency(Math.abs(difference()))}`
      );
      return false;
    }

    // Check if total is not zero
    if (totalDebit() === 0) {
      toastStore.error('Transaction amount cannot be zero');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!authStore.selectedCompany) {
      toastStore.error('No company selected');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const data = formData();

      // Convert entries to API format
      const transactionEntries: Omit<TransactionEntry, '_id'>[] = entries()
        .filter((e) => e.accountId && (e.debitAmount || e.creditAmount))
        .map((e) => ({
          account: e.accountId,
          debit: parseFloat(e.debitAmount) || 0,
          credit: parseFloat(e.creditAmount) || 0,
          description: e.description || data.description,
        }));

      const request: CreateTransactionRequest = {
        companyId: authStore.selectedCompany._id,
        date: data.date,
        description: data.description,
        reference: data.reference,
        notes: data.notes,
        sourceType: 'MANUAL',
        entries: transactionEntries,
      };

      await apiClient.createTransaction(request);

      toastStore.success('Journal entry created successfully!');
      resetForm();
      props.onSuccess();
      props.onClose();
    } catch (error) {
      console.error('Failed to create journal entry:', error);
      toastStore.error(
        error instanceof Error
          ? error.message
          : 'Failed to create journal entry'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      notes: '',
    });
    setEntries([
      {
        id: 0,
        accountId: '',
        description: '',
        debitAmount: '',
        creditAmount: '',
      },
      {
        id: 1,
        accountId: '',
        description: '',
        debitAmount: '',
        creditAmount: '',
      },
    ]);
    setNextId(2);
  };

  const handleClose = () => {
    if (!isSubmitting()) {
      resetForm();
      props.onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="📒 Create Journal Entry"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} class="space-y-6">
        {/* Header Fields */}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Description */}
          <div class="md:col-span-2">
            <EmoneyInput
              label="Description"
              type="text"
              placeholder="e.g., Monthly rent payment, Inventory purchase"
              value={formData().description}
              onInput={(value) =>
                setFormData({ ...formData(), description: value })
              }
              required
            />
          </div>

          {/* Date */}
          <EmoneyInput
            label="Date"
            type="date"
            value={formData().date}
            onInput={(value) => setFormData({ ...formData(), date: value })}
            required
          />

          {/* Reference */}
          <EmoneyInput
            label="Reference"
            type="text"
            placeholder="e.g., INV-001, Check #1234"
            value={formData().reference || ''}
            onInput={(value) =>
              setFormData({ ...formData(), reference: value })
            }
          />
        </div>

        {/* Journal Entry Lines */}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Journal Entries</h3>
            <KobalteButton
              type="button"
              variant="secondary"
              onClick={addLine}
              class="text-xs"
            >
              + Add Line
            </KobalteButton>
          </div>

          {/* Table Header */}
          <div class="grid grid-cols-12 gap-2 rounded-lg bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
            <div class="col-span-4">Account</div>
            <div class="col-span-3">Description</div>
            <div class="col-span-2 text-right">Debit</div>
            <div class="col-span-2 text-right">Credit</div>
            <div class="col-span-1" />
          </div>

          {/* Entry Lines */}
          <div class="max-h-96 space-y-2 overflow-y-auto pr-2">
            <For each={entries()}>
              {(entry) => (
                <div class="grid grid-cols-12 items-start gap-2 rounded-lg border border-gray-200 bg-white/50 p-2 transition-colors hover:border-blue-300">
                  {/* Account */}
                  <div class="col-span-4">
                    <EmoneySelect
                      placeholder="Select account"
                      value={entry.accountId}
                      options={(accountsQuery.data || []).map((acc) => ({
                        value: acc._id,
                        label: `${acc.code} - ${acc.name}`,
                      }))}
                      onChange={(value) =>
                        updateEntry(entry.id, 'accountId', value)
                      }
                    />
                  </div>

                  {/* Description */}
                  <div class="col-span-3">
                    <EmoneyInput
                      type="text"
                      placeholder="Line description"
                      value={entry.description}
                      onInput={(value) =>
                        updateEntry(entry.id, 'description', value)
                      }
                    />
                  </div>

                  {/* Debit */}
                  <div class="col-span-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={entry.debitAmount}
                      onBlur={(e) =>
                        updateAmount(
                          entry.id,
                          'debitAmount',
                          e.currentTarget.value
                        )
                      }
                      class="w-full rounded-lg border border-gray-300 bg-white/85 px-3 py-2.5 text-right text-sm text-gray-900 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out placeholder:text-gray-500 hover:scale-[1.01] hover:border-blue-400 hover:bg-white hover:shadow-lg focus:scale-[1.01] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Credit */}
                  <div class="col-span-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={entry.creditAmount}
                      onBlur={(e) =>
                        updateAmount(
                          entry.id,
                          'creditAmount',
                          e.currentTarget.value
                        )
                      }
                      class="w-full rounded-lg border border-gray-300 bg-white/85 px-3 py-2.5 text-right text-sm text-gray-900 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out placeholder:text-gray-500 hover:scale-[1.01] hover:border-blue-400 hover:bg-white hover:shadow-lg focus:scale-[1.01] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Remove Button */}
                  <div class="col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeLine(entry.id)}
                      class="rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                      disabled={entries().length <= 2}
                      title="Remove line"
                    >
                      <svg
                        class="h-5 w-5"
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
                </div>
              )}
            </For>
          </div>

          {/* Totals Row */}
          <div class="grid grid-cols-12 gap-2 rounded-lg border-2 border-gray-300 bg-gray-100 px-2 py-2 text-sm font-semibold">
            <div class="col-span-7 flex items-center">
              Total
              <Show when={!isBalanced()}>
                <span class="ml-2 text-xs font-normal text-red-600">
                  (Out of balance by {formatCurrency(Math.abs(difference()))})
                </span>
              </Show>
              <Show when={isBalanced() && totalDebit() > 0}>
                <span class="ml-2 flex items-center text-xs font-normal text-green-600">
                  <svg
                    class="mr-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Balanced
                </span>
              </Show>
            </div>
            <div
              class={`col-span-2 text-right ${!isBalanced() ? 'text-red-600' : 'text-gray-900'}`}
            >
              {formatCurrency(totalDebit())}
            </div>
            <div
              class={`col-span-2 text-right ${!isBalanced() ? 'text-red-600' : 'text-gray-900'}`}
            >
              {formatCurrency(totalCredit())}
            </div>
            <div class="col-span-1" />
          </div>
        </div>

        {/* Notes */}
        <EmoneyTextarea
          label="Notes"
          placeholder="Additional notes or memo..."
          value={formData().notes || ''}
          onInput={(value) => setFormData({ ...formData(), notes: value })}
          rows={2}
        />

        {/* Loading indicator */}
        <Show when={accountsQuery.isLoading}>
          <div class="py-2 text-center text-sm text-gray-500">
            Loading accounts...
          </div>
        </Show>

        {/* Action Buttons */}
        <div class="flex justify-end space-x-3 border-t pt-4">
          <KobalteButton
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting()}
          >
            Cancel
          </KobalteButton>
          <KobalteButton
            type="submit"
            disabled={isSubmitting() || !isBalanced() || totalDebit() === 0}
          >
            {isSubmitting() ? 'Creating...' : 'Create Journal Entry'}
          </KobalteButton>
        </div>
      </form>
    </Modal>
  );
};
