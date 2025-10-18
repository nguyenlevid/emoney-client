import { createSignal, Show, For, createMemo, createEffect } from 'solid-js';
import { createQuery } from '@tanstack/solid-query';
import { Modal } from '@/components/ui/Modal';
import { KobalteButton } from '@/components/ui/KobalteButton';
import { EmoneyInput } from '@/components/ui/EmoneyInput';
import { EmoneySearchableSelect } from '../ui/EmoneySearchableSelect';
import { EmoneyTextarea } from '@/components/ui/EmoneyTextarea';
import { apiClient } from '@/lib/api/client';
import { authStore } from '@/lib/auth/authStore';
import { toastStore } from '@/lib/stores/toastStore';
import type {
  Transaction,
  UpdateTransactionRequest,
  TransactionEntry,
} from '@/types';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: Transaction;
}

interface JournalEntryLine {
  id: number;
  accountId: string;
  description: string;
  debitAmount: string;
  creditAmount: string;
}

export const EditTransactionModal = (props: EditTransactionModalProps) => {
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [nextId, setNextId] = createSignal(0);

  const [formData, setFormData] = createSignal({
    date: '',
    description: '',
    reference: '',
    notes: '',
  });

  const [entries, setEntries] = createSignal<JournalEntryLine[]>([]);

  // Populate form when transaction changes or modal opens
  createEffect(() => {
    if (props.isOpen && props.transaction) {
      const txn = props.transaction;

      setFormData({
        date: txn.date.split('T')[0],
        description: txn.description,
        reference: txn.reference || '',
        notes: txn.notes || '',
      });

      // Convert transaction entries to editable lines
      const lines = txn.entries.map((entry, index) => {
        const accountId =
          typeof entry.account === 'string'
            ? entry.account
            : (entry.account as { _id?: string })?._id || '';

        return {
          id: index,
          accountId,
          description: entry.description || '',
          debitAmount: entry.debit ? entry.debit.toString() : '',
          creditAmount: entry.credit ? entry.credit.toString() : '',
        };
      });

      setEntries(lines);
      setNextId(lines.length);
    }
  });

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
  const isBalanced = createMemo(() => Math.abs(difference()) < 0.01);

  // Check if transaction is reconciled
  const isReconciled = createMemo(() => !!props.transaction?.reconciledAt);

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

  // Handle description input - no state update on input, only on blur
  const handleDescriptionBlur = (
    e: FocusEvent & { currentTarget: HTMLInputElement },
    id: number,
    field: 'description'
  ) => {
    const value = e.currentTarget.value.trim();
    setEntries(
      entries().map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  // Handle amount input change - filters but doesn't cause re-render issues
  const handleAmountInput = (
    e: InputEvent & { currentTarget: HTMLInputElement },
    _id: number,
    _field: 'debitAmount' | 'creditAmount'
  ) => {
    const input = e.currentTarget;
    const cursorPosition = input.selectionStart || 0;
    const oldValue = input.value;

    // Filter to allow only numbers and one decimal point
    const filtered = oldValue
      .split('')
      .filter((char) => /[0-9.]/.test(char))
      .join('');

    // Count decimal points and allow only one
    const decimalCount = (filtered.match(/\./g) || []).length;
    let finalValue = filtered;

    if (decimalCount > 1) {
      // Keep only the first decimal point
      const parts = filtered.split('.');
      finalValue = parts[0] + '.' + parts.slice(1).join('');
    }

    // Update the input value directly (no state update yet)
    if (finalValue !== oldValue) {
      input.value = finalValue;
      // Restore cursor position
      input.setSelectionRange(cursorPosition, cursorPosition);
    }
  };

  // Update state only on blur for better performance
  const handleAmountBlur = (
    e: FocusEvent & { currentTarget: HTMLInputElement },
    id: number,
    field: 'debitAmount' | 'creditAmount'
  ) => {
    let value = e.currentTarget.value.trim();

    if (!value || value === '' || value === '.') {
      value = '';
    } else {
      // Sanitize: limit to 2 decimal places
      const parts = value.split('.');
      if (parts.length > 1) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
      }

      // Remove leading zeros except for "0" or "0.xx"
      if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
        value = value.replace(/^0+/, '');
      }

      // Ensure we don't have an empty string after removing zeros
      if (value === '' || value === '.') {
        value = '';
      }
    }

    // Update state only on blur
    setEntries(
      entries().map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const validateForm = (): boolean => {
    const data = formData();

    if (!data.description?.trim()) {
      toastStore.error('Please enter a description');
      return false;
    }

    if (!data.date) {
      toastStore.error('Please select a date');
      return false;
    }

    // Validate entries
    const validEntries = entries().filter(
      (e) =>
        e.accountId &&
        (parseFloat(e.debitAmount) > 0 || parseFloat(e.creditAmount) > 0)
    );

    if (validEntries.length < 2) {
      toastStore.error('At least 2 valid entries required');
      return false;
    }

    // Check for both debit and credit in same line
    const invalidLines = entries().filter(
      (e) => parseFloat(e.debitAmount) > 0 && parseFloat(e.creditAmount) > 0
    );

    if (invalidLines.length > 0) {
      toastStore.error('Each line must have either debit or credit, not both');
      return false;
    }

    if (!isBalanced()) {
      toastStore.error(
        `Entry is not balanced. Difference: ${formatCurrency(Math.abs(difference()))}`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (isReconciled()) {
      toastStore.error('Cannot edit reconciled transactions');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = formData();
      const validEntries = entries().filter(
        (e) =>
          e.accountId &&
          (parseFloat(e.debitAmount) > 0 || parseFloat(e.creditAmount) > 0)
      );

      const transactionData: UpdateTransactionRequest = {
        date: data.date,
        description: data.description.trim(),
        reference: data.reference?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        entries: validEntries.map((entry) => {
          const entryData: Omit<TransactionEntry, '_id'> = {
            account: entry.accountId,
            debit: parseFloat(entry.debitAmount) || 0,
            credit: parseFloat(entry.creditAmount) || 0,
            description: entry.description?.trim() || undefined,
          };
          return entryData;
        }),
      };

      await apiClient.updateTransaction(
        props.transaction._id,
        transactionData,
        authStore.selectedCompany?._id
      );

      toastStore.success('Transaction updated successfully');
      props.onSuccess();
      handleClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update transaction';
      console.error('Failed to update transaction:', error);
      toastStore.error(errorMessage);
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
      title="Edit Transaction"
      maxWidth="5xl"
    >
      <form onSubmit={handleSubmit} class="space-y-6">
        {/* Reconciliation Warning */}
        <Show when={isReconciled()}>
          <div class="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg
                  class="h-6 w-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-sm font-medium text-amber-800">
                  This transaction is reconciled
                </h3>
                <p class="mt-1 text-sm text-amber-700">
                  Reconciled transactions cannot be edited to maintain audit
                  trail integrity. Please unreconcile this transaction first if
                  you need to make changes.
                </p>
                <Show when={props.transaction.reconciledBy}>
                  <p class="mt-2 text-xs text-amber-600">
                    Reconciled by: {props.transaction.reconciledBy} on{' '}
                    {new Date(props.transaction.reconciledAt!).toLocaleString()}
                  </p>
                </Show>
              </div>
            </div>
          </div>
        </Show>

        {/* Transaction Info */}
        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-3 text-sm font-semibold text-gray-700">
            Transaction Information
          </h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <EmoneyInput
              label="Date *"
              type="date"
              value={formData().date}
              onInput={(value: string) =>
                setFormData({ ...formData(), date: value })
              }
              disabled={isReconciled()}
              required
            />
            <EmoneyInput
              label="Reference Number"
              type="text"
              placeholder="Optional reference number"
              value={formData().reference}
              onInput={(value: string) =>
                setFormData({ ...formData(), reference: value })
              }
              disabled={isReconciled()}
            />
          </div>

          <div class="mt-4">
            <EmoneyInput
              label="Description *"
              type="text"
              placeholder="Describe this transaction"
              value={formData().description}
              onInput={(value: string) =>
                setFormData({ ...formData(), description: value })
              }
              disabled={isReconciled()}
              required
            />
          </div>

          <div class="mt-4">
            <EmoneyTextarea
              label="Notes"
              placeholder="Additional notes (optional)"
              value={formData().notes}
              onInput={(value: string) =>
                setFormData({ ...formData(), notes: value })
              }
              disabled={isReconciled()}
              rows={2}
            />
          </div>
        </div>

        {/* Journal Entries */}
        <div class="rounded-lg border border-gray-200 bg-white">
          <div class="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 class="text-sm font-semibold text-gray-700">Journal Entries</h3>
            <p class="mt-1 text-xs text-gray-500">
              Enter the debits and credits for this transaction
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th class="px-4 py-3 text-left font-medium">Account</th>
                  <th class="px-4 py-3 text-left font-medium">Description</th>
                  <th class="px-4 py-3 text-right font-medium">Debit</th>
                  <th class="px-4 py-3 text-right font-medium">Credit</th>
                  <th class="w-16 px-4 py-3" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <For each={entries()}>
                  {(entry, index) => (
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3">
                        <EmoneySearchableSelect
                          value={entry.accountId}
                          options={[
                            { value: '', label: 'Select account...' },
                            ...(accountsQuery.data || []).map((account) => ({
                              value: account._id,
                              label: `${account.code} - ${account.name}`,
                            })),
                          ]}
                          onChange={(value) =>
                            updateEntry(entry.id, 'accountId', value)
                          }
                          disabled={isReconciled()}
                          class="min-w-[200px]"
                          tabIndex={index() * 10 + 1}
                        />
                      </td>
                      <td class="px-4 py-3">
                        <input
                          type="text"
                          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                          placeholder="Line description"
                          value={entry.description}
                          tabIndex={index() * 10 + 2}
                          onBlur={(e) =>
                            handleDescriptionBlur(e, entry.id, 'description')
                          }
                          disabled={isReconciled()}
                        />
                      </td>
                      <td class="px-4 py-3">
                        <input
                          type="text"
                          inputMode="decimal"
                          class="w-full rounded-md border border-gray-300 px-3 py-2 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                          placeholder="0.00"
                          value={entry.debitAmount}
                          tabIndex={index() * 10 + 3}
                          onInput={(e) =>
                            handleAmountInput(e, entry.id, 'debitAmount')
                          }
                          onBlur={(e) =>
                            handleAmountBlur(e, entry.id, 'debitAmount')
                          }
                          disabled={isReconciled()}
                        />
                      </td>
                      <td class="px-4 py-3">
                        <input
                          type="text"
                          inputMode="decimal"
                          class="w-full rounded-md border border-gray-300 px-3 py-2 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                          placeholder="0.00"
                          value={entry.creditAmount}
                          tabIndex={index() * 10 + 4}
                          onInput={(e) =>
                            handleAmountInput(e, entry.id, 'creditAmount')
                          }
                          onBlur={(e) =>
                            handleAmountBlur(e, entry.id, 'creditAmount')
                          }
                          disabled={isReconciled()}
                        />
                      </td>
                      <td class="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeLine(entry.id)}
                          tabIndex={-1}
                          class="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-gray-400"
                          disabled={entries().length <= 2 || isReconciled()}
                          title={
                            entries().length <= 2
                              ? 'Minimum 2 lines required'
                              : 'Remove line'
                          }
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
              <tfoot class="border-t-2 border-gray-300 bg-gray-50">
                <tr class="font-semibold">
                  <td colspan="2" class="px-4 py-3 text-right">
                    Totals:
                  </td>
                  <td
                    class="px-4 py-3 text-right"
                    classList={{
                      'text-green-600': isBalanced(),
                      'text-red-600': !isBalanced(),
                    }}
                  >
                    {formatCurrency(totalDebit())}
                  </td>
                  <td
                    class="px-4 py-3 text-right"
                    classList={{
                      'text-green-600': isBalanced(),
                      'text-red-600': !isBalanced(),
                    }}
                  >
                    {formatCurrency(totalCredit())}
                  </td>
                  <td />
                </tr>
                <Show when={!isBalanced()}>
                  <tr>
                    <td colspan="5" class="px-4 py-2 text-center">
                      <span class="text-sm font-medium text-red-600">
                        Out of balance by:{' '}
                        {formatCurrency(Math.abs(difference()))}
                      </span>
                    </td>
                  </tr>
                </Show>
              </tfoot>
            </table>
          </div>

          <div class="border-t border-gray-200 p-4">
            <KobalteButton
              type="button"
              variant="secondary"
              onClick={addLine}
              disabled={isReconciled()}
              class="w-full sm:w-auto"
            >
              <svg
                class="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Line
            </KobalteButton>
          </div>
        </div>

        {/* Audit Trail Info */}
        <Show
          when={props.transaction.createdBy || props.transaction.modifiedBy}
        >
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 class="mb-2 text-xs font-semibold uppercase text-gray-600">
              Audit Trail
            </h4>
            <div class="space-y-1 text-xs text-gray-600">
              <Show when={props.transaction.createdBy}>
                <p>
                  <span class="font-medium">Created by:</span>{' '}
                  {props.transaction.createdBy}
                  <Show when={props.transaction.createdAt}>
                    {' '}
                    on {new Date(props.transaction.createdAt!).toLocaleString()}
                  </Show>
                </p>
              </Show>
              <Show when={props.transaction.modifiedBy}>
                <p>
                  <span class="font-medium">Last modified by:</span>{' '}
                  {props.transaction.modifiedBy}
                  <Show when={props.transaction.updatedAt}>
                    {' '}
                    on {new Date(props.transaction.updatedAt!).toLocaleString()}
                  </Show>
                </p>
              </Show>
            </div>
          </div>
        </Show>

        {/* Actions */}
        <div class="flex justify-end space-x-3 border-t border-gray-200 pt-6">
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
            disabled={isSubmitting() || !isBalanced() || isReconciled()}
          >
            <Show when={!isSubmitting()} fallback="Updating...">
              Update Transaction
            </Show>
          </KobalteButton>
        </div>
      </form>
    </Modal>
  );
};
