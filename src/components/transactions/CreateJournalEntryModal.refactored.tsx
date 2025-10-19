import type { Component } from 'solid-js';
import { Show, createSignal, createMemo, createEffect, For } from 'solid-js';
import { createQuery } from '@tanstack/solid-query';
import { Modal } from '@/components/ui/Modal';
import { KobalteButton } from '@/components/ui/KobalteButton';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { apiClient } from '@/lib/api/client';
import { authStore } from '@/lib/auth/authStore';
import { toastStore } from '@/lib/stores/toastStore';
import { cn } from '@/lib/utils/cn';
import type { CreateTransactionRequest } from '@/types';

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

export const CreateJournalEntryModal: Component<
  CreateJournalEntryModalProps
> = (props) => {
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [nextId, setNextId] = createSignal(2);
  const [isDiscarding, setIsDiscarding] = createSignal(false);

  const STORAGE_KEY = 'journal_entry_draft';

  // Load saved draft from localStorage
  const loadDraft = () => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        // Validate that the draft has the expected structure
        if (draft.formData && draft.entries && Array.isArray(draft.entries)) {
          return draft;
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  // Save draft to localStorage
  const saveDraft = () => {
    try {
      const draft = {
        formData: formData(),
        entries: entries(),
        nextId: nextId(),
        timestamp: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  const [formData, setFormData] = createSignal({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    notes: '',
  });

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

  // Reset form when modal opens - try to load draft first
  createEffect(() => {
    if (props.isOpen) {
      const draft = loadDraft();
      if (draft) {
        // Restore from draft
        setFormData(draft.formData);
        setEntries(draft.entries);
        setNextId(draft.nextId || draft.entries.length);
        toastStore.info('Draft restored');
      } else {
        // Fresh form
        resetForm();
      }
    }
  });

  // Auto-save draft whenever form data or entries change
  createEffect(() => {
    // Only save if modal is open and there's actual data
    if (props.isOpen && !isDiscarding()) {
      const data = formData();
      const lines = entries();

      // Check if there's any meaningful data to save
      const hasData =
        data.description.trim() !== '' ||
        data.reference.trim() !== '' ||
        data.notes.trim() !== '' ||
        lines.some(
          (line) =>
            line.accountId !== '' ||
            line.description.trim() !== '' ||
            line.debitAmount.trim() !== '' ||
            line.creditAmount.trim() !== ''
        );

      if (hasData) {
        saveDraft();
      }
    }
  });

  // Fetch accounts
  const accountsQuery = createQuery(() => ({
    queryKey: ['accounts', authStore.selectedCompany?._id] as const,
    queryFn: async () => {
      if (!authStore.selectedCompany) return [];
      return apiClient.getAccounts(authStore.selectedCompany._id);
    },
    enabled: !!authStore.selectedCompany && props.isOpen,
  }));

  const accountOptions = createMemo(() =>
    (accountsQuery.data || []).map((acc) => ({
      value: acc._id,
      label: `${acc.code} - ${acc.name}`,
    }))
  );

  // Calculate totals - simple, no debouncing
  const totalDebit = createMemo(() =>
    entries().reduce((sum, entry) => {
      const amount = parseFloat(entry.debitAmount) || 0;
      return sum + amount;
    }, 0)
  );

  const totalCredit = createMemo(() =>
    entries().reduce((sum, entry) => {
      const amount = parseFloat(entry.creditAmount) || 0;
      return sum + amount;
    }, 0)
  );

  const difference = createMemo(() => totalDebit() - totalCredit());
  const isBalanced = createMemo(() => Math.abs(difference()) < 0.01);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Update entry field - only update if value actually changed
  const updateEntry = (
    id: number,
    field: keyof JournalEntryLine,
    value: string
  ) => {
    const entry = entries().find((e) => e.id === id);
    // Don't update if value hasn't changed (prevents unnecessary re-renders)
    if (entry && entry[field] === value) {
      return;
    }
    setEntries(
      entries().map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  // Handle amount input - filter only, DON'T update state yet
  const handleAmountInput = (
    e: InputEvent & { currentTarget: HTMLInputElement }
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

    // Update the input value directly (no state update!)
    if (finalValue !== oldValue) {
      input.value = finalValue;
      // Restore cursor position
      input.setSelectionRange(cursorPosition, cursorPosition);
    }
  };

  // Update state only on blur - delay to not interfere with tab navigation
  const handleAmountBlur = (
    e: FocusEvent & { currentTarget: HTMLInputElement },
    id: number,
    field: 'debitAmount' | 'creditAmount'
  ) => {
    const input = e.currentTarget;
    let value = input.value.trim();

    if (!value || value === '' || value === '.') {
      value = '';
    } else {
      // Limit to 2 decimal places
      const parts = value.split('.');
      if (parts.length > 1) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
      }
    }

    // Double-entry rule: A line can have either debit OR credit, not both
    // If entering a value, immediately clear the opposite field's DOM
    if (value) {
      const oppositeFieldName = field === 'debitAmount' ? 'credit' : 'debit';
      const oppositeInput = document.querySelector(
        `input[name="${oppositeFieldName}-${id}"]`
      ) as HTMLInputElement;
      if (oppositeInput && oppositeInput.value) {
        oppositeInput.value = ''; // Clear immediately before setTimeout
      }
    }

    // Delay state update until after tab navigation completes
    setTimeout(() => {
      if (value) {
        // User entered a value in this field - clear opposite field
        const oppositeField =
          field === 'debitAmount' ? 'creditAmount' : 'debitAmount';
        updateEntry(id, field, value);
        updateEntry(id, oppositeField, '');
      } else {
        // User cleared this field - only update this field
        updateEntry(id, field, value);
      }
    }, 50);
  };

  // Handle description blur - delay update to not interfere with tab navigation
  const handleDescriptionBlur = (
    e: FocusEvent & { currentTarget: HTMLInputElement },
    id: number
  ) => {
    const value = e.currentTarget.value;
    // Delay state update until after tab navigation completes
    setTimeout(() => {
      updateEntry(id, 'description', value);
    }, 50);
  };

  // Add line
  const addLine = () => {
    const id = nextId();
    setEntries([
      ...entries(),
      { id, accountId: '', description: '', debitAmount: '', creditAmount: '' },
    ]);
    setNextId(id + 1);
  };

  // Remove line
  const removeLine = (id: number) => {
    if (entries().length <= 2) {
      toastStore.error('Minimum 2 entries required');
      return;
    }
    setEntries(entries().filter((e) => e.id !== id));
  };

  const validateForm = (): boolean => {
    const data = formData();

    if (!data.description?.trim()) {
      toastStore.error('Please enter a description');
      return false;
    }

    const validEntries = entries().filter(
      (e) => e.accountId && (e.debitAmount || e.creditAmount)
    );

    if (validEntries.length < 2) {
      toastStore.error('At least 2 valid entries required');
      return false;
    }

    const hasDoubleEntry = entries().some((e) => {
      const hasDebit = e.debitAmount && parseFloat(e.debitAmount) > 0;
      const hasCredit = e.creditAmount && parseFloat(e.creditAmount) > 0;
      return hasDebit && hasCredit;
    });

    if (hasDoubleEntry) {
      toastStore.error('Each line can have either a debit OR credit, not both');
      return false;
    }

    if (!isBalanced()) {
      toastStore.error(
        `Debits and credits must be equal. Difference: ${formatCurrency(Math.abs(difference()))}`
      );
      return false;
    }

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
      // Backend expects accountId (not account) for create requests
      const transactionEntries = entries()
        .filter((e) => e.accountId && (e.debitAmount || e.creditAmount))
        .map((e) => ({
          accountId: e.accountId,
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
      clearDraft(); // Clear saved draft after successful submission
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
    const initialEntries = [
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
    ];
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      notes: '',
    });
    setEntries(initialEntries);
    setNextId(2);
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
      title="📒 Create Journal Entry"
      maxWidth="6xl"
    >
      <form onSubmit={handleSubmit} class="space-y-6">
        {/* Header Fields */}
        <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 p-5">
          <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <svg
              class="h-4 w-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Transaction Details
          </h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="md:col-span-2">
              <FormInput
                name="description"
                label="Description"
                placeholder="e.g., Monthly rent payment, Inventory purchase"
                value={formData().description}
                onInput={(value) =>
                  setFormData({ ...formData(), description: value })
                }
                required
                tabIndex={1}
                autoFocus
              />
            </div>

            <FormInput
              name="date"
              label="Date"
              type="date"
              value={formData().date}
              onInput={(value) => setFormData({ ...formData(), date: value })}
              required
              tabIndex={2}
            />

            <FormInput
              name="reference"
              label="Reference"
              placeholder="e.g., INV-001, Check #1234"
              value={formData().reference}
              onInput={(value) =>
                setFormData({ ...formData(), reference: value })
              }
              tabIndex={3}
            />
          </div>
        </div>

        {/* Journal Entry Lines */}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg
                  class="h-4 w-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Journal Entries
              </h3>
              <p class="mt-0.5 text-xs text-gray-500">
                Enter debits and credits for each account
              </p>
            </div>
            <KobalteButton
              type="button"
              variant="secondary"
              onClick={addLine}
              class="text-xs"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Line
            </KobalteButton>
          </div>

          {/* Table Header */}
          <div class="grid grid-cols-12 gap-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2.5 text-xs font-semibold text-gray-600 shadow-sm">
            <div class="col-span-4">Account</div>
            <div class="col-span-3">Description</div>
            <div class="col-span-2 text-right">Debit</div>
            <div class="col-span-2 text-right">Credit</div>
            <div class="col-span-1 text-center">Action</div>
          </div>

          {/* Entry Lines */}
          <div class="space-y-2">
            <For each={entries()}>
              {(entry) => {
                // Use entry.id directly for stable tab indices
                const baseTabIndex = 100 + entry.id * 10;
                return (
                  <div class="grid grid-cols-12 items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md">
                    <div class="col-span-4">
                      <FormSelect
                        name={`account-${entry.id}`}
                        placeholder="Search accounts..."
                        value={entry.accountId}
                        options={accountOptions()}
                        onChange={(value) =>
                          updateEntry(entry.id, 'accountId', value)
                        }
                        searchable
                        tabIndex={baseTabIndex + 1}
                      />
                    </div>

                    <div class="col-span-3">
                      <input
                        type="text"
                        name={`description-${entry.id}`}
                        placeholder="Line description"
                        value={entry.description}
                        onBlur={(e) => handleDescriptionBlur(e, entry.id)}
                        tabIndex={baseTabIndex + 2}
                        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div class="col-span-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        name={`debit-${entry.id}`}
                        placeholder="0.00"
                        value={entry.debitAmount}
                        onInput={handleAmountInput}
                        onBlur={(e) =>
                          handleAmountBlur(e, entry.id, 'debitAmount')
                        }
                        tabIndex={baseTabIndex + 3}
                        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-right text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div class="col-span-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        name={`credit-${entry.id}`}
                        placeholder="0.00"
                        value={entry.creditAmount}
                        onInput={handleAmountInput}
                        onBlur={(e) =>
                          handleAmountBlur(e, entry.id, 'creditAmount')
                        }
                        tabIndex={baseTabIndex + 4}
                        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-right text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div class="col-span-1 flex items-start justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => removeLine(entry.id)}
                        tabIndex={-1}
                        class={cn(
                          'rounded-lg p-1.5 transition-all',
                          'text-gray-400 hover:bg-red-50 hover:text-red-600',
                          'disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400'
                        )}
                        disabled={entries().length <= 2}
                        title="Remove line"
                      >
                        <svg
                          class="h-4 w-4"
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
                    </div>
                  </div>
                );
              }}
            </For>
          </div>

          {/* Totals */}
          <div class="grid grid-cols-12 gap-2 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-3 text-sm font-semibold shadow-sm">
            <div class="col-span-7 flex items-center gap-2 text-gray-700">
              <svg
                class="h-4 w-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Totals
            </div>
            <div
              class={cn(
                'col-span-2 text-right',
                totalDebit() > 0 ? 'text-gray-900' : 'text-gray-400'
              )}
            >
              {formatCurrency(totalDebit())}
            </div>
            <div
              class={cn(
                'col-span-2 text-right',
                totalCredit() > 0 ? 'text-gray-900' : 'text-gray-400'
              )}
            >
              {formatCurrency(totalCredit())}
            </div>
            <div class="col-span-1" />
          </div>

          {/* Balance Indicator */}
          <div
            class={cn(
              'rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all duration-200',
              isBalanced()
                ? 'border-green-200 bg-green-50 text-green-700 shadow-sm'
                : 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm'
            )}
          >
            <div class="flex items-center gap-2">
              <Show
                when={isBalanced()}
                fallback={
                  <svg
                    class="h-5 w-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                }
              >
                <svg
                  class="h-5 w-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </Show>
              <span>
                {isBalanced()
                  ? 'Balanced ✓'
                  : `Out of balance by ${formatCurrency(Math.abs(difference()))}`}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <FormTextarea
          name="notes"
          label="Notes"
          placeholder="Additional notes or memo..."
          value={formData().notes}
          onInput={(value) => setFormData({ ...formData(), notes: value })}
          rows={2}
          tabIndex={1000}
        />

        {/* Loading indicator */}
        <Show when={accountsQuery.isLoading}>
          <div class="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
            <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            Loading accounts...
          </div>
        </Show>

        {/* Action Buttons */}
        <div class="flex items-center justify-between border-t pt-4">
          <Show when={loadDraft() !== null}>
            <KobalteButton
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDiscarding(true);
                clearDraft();
                resetForm();
                toastStore.info('Draft discarded');
                // Re-enable auto-save after a brief delay
                setTimeout(() => setIsDiscarding(false), 100);
              }}
              disabled={isSubmitting()}
              class="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <svg
                class="mr-2 h-4 w-4"
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
              Discard Draft
            </KobalteButton>
          </Show>
          <div class="ml-auto flex gap-3">
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
              disabled={isSubmitting() || !isBalanced() || totalDebit() === 0}
            >
              <Show when={isSubmitting()} fallback="Create Journal Entry">
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
                Creating...
              </Show>
            </KobalteButton>
          </div>
        </div>
      </form>
    </Modal>
  );
};
